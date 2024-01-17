import {
	MESSAGES_BEFORE_LOGIN,
	RATE_LIMIT,
	JUPYTER_API_URL,
	N_EXECUTION_LIMIT,
} from "$env/static/private";
import { authCondition, requiresUser } from "$lib/server/auth";
import { collections } from "$lib/server/database";
import { models } from "$lib/server/models";
import { ERROR_MESSAGES } from "$lib/stores/errors";
import type { Message } from "$lib/types/Message";
import { error } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { MessageUpdate } from "$lib/types/MessageUpdate";
import { runWebSearch } from "$lib/server/websearch/runWebSearch";
import type { WebSearch } from "$lib/types/WebSearch";
import { abortedGenerations } from "$lib/server/abortedGenerations";
import { summarize } from "$lib/server/summarize";
import { uploadFile } from "$lib/server/files/uploadFile";
import sizeof from "image-size";

export async function POST({ request, locals, params, getClientAddress }) {
	const id = z.string().parse(params.id);
	const convId = new ObjectId(id);
	const promptedAt = new Date();

	const userId = locals.user?._id ?? locals.sessionId;

	// check user
	if (!userId) {
		throw error(401, "Unauthorized");
	}

	// check if the user has access to the conversation
	const conv = await collections.conversations.findOne({
		_id: convId,
		...authCondition(locals),
	});

	if (!conv) {
		throw error(404, "Conversation not found");
	}

	// register the event for ratelimiting
	await collections.messageEvents.insertOne({
		userId: userId,
		createdAt: new Date(),
		ip: getClientAddress(),
	});

	// guest mode check
	if (
		!locals.user?._id &&
		requiresUser &&
		(MESSAGES_BEFORE_LOGIN ? parseInt(MESSAGES_BEFORE_LOGIN) : 0) > 0
	) {
		const totalMessages =
			(
				await collections.conversations
					.aggregate([
						{ $match: authCondition(locals) },
						{ $project: { messages: 1 } },
						{ $unwind: "$messages" },
						{ $match: { "messages.from": "assistant" } },
						{ $count: "messages" },
					])
					.toArray()
			)[0]?.messages ?? 0;

		if (totalMessages > parseInt(MESSAGES_BEFORE_LOGIN)) {
			throw error(429, "Exceeded number of messages before login");
		}
	}

	// check if the user is rate limited
	const nEvents = Math.max(
		await collections.messageEvents.countDocuments({ userId }),
		await collections.messageEvents.countDocuments({ ip: getClientAddress() })
	);

	if (RATE_LIMIT != "" && nEvents > parseInt(RATE_LIMIT)) {
		throw error(429, ERROR_MESSAGES.rateLimited);
	}

	// fetch the model
	const model = models.find((m) => m.id === conv.model);

	if (!model) {
		throw error(410, "Model not available anymore");
	}

	// finally parse the content of the request
	const json = await request.json();

	const {
		inputs: newPrompt,
		response_id: responseId,
		id: messageId,
		is_retry,
		web_search: webSearch,
		files: b64files,
	} = z
		.object({
			inputs: z.string().trim().min(1),
			id: z.optional(z.string().uuid()),
			response_id: z.optional(z.string().uuid()),
			is_retry: z.optional(z.boolean()),
			web_search: z.optional(z.boolean()),
			files: z.optional(z.array(z.string())),
		})
		.parse(json);

	// files is an array of base64 strings encoding Blob objects
	// we need to convert this array to an array of File objects

	const files = b64files?.map((file) => {
		const blob = Buffer.from(file, "base64");
		return new File([blob], "image.png");
	});

	// check sizes
	if (files) {
		const filechecks = await Promise.all(
			files.map(async (file) => {
				const dimensions = sizeof(Buffer.from(await file.arrayBuffer()));
				return (
					file.size > 2 * 1024 * 1024 ||
					(dimensions.width ?? 0) > 224 ||
					(dimensions.height ?? 0) > 224
				);
			})
		);

		if (filechecks.some((check) => check)) {
			throw error(413, "File too large, should be <2MB and 224x224 max.");
		}
	}

	let hashes: undefined | string[];

	if (files) {
		hashes = await Promise.all(files.map(async (file) => await uploadFile(file, conv)));
	}

	// get the list of messages
	// while checking for retries
	let messages = (() => {
		if (is_retry && messageId) {
			// if the message is a retry, replace the message and remove the messages after it
			let retryMessageIdx = conv.messages.findIndex((message) => message.id === messageId);
			if (retryMessageIdx === -1) {
				retryMessageIdx = conv.messages.length;
			}
			return [
				...conv.messages.slice(0, retryMessageIdx),
				{
					content: newPrompt,
					from: "user",
					id: messageId as Message["id"],
					updatedAt: new Date(),
					files: conv.messages[retryMessageIdx]?.files,
				},
			];
		} // else append the message at the bottom

		return [
			...conv.messages,
			{
				content: newPrompt,
				from: "user",
				id: (messageId as Message["id"]) || crypto.randomUUID(),
				createdAt: new Date(),
				updatedAt: new Date(),
				files: hashes,
			},
		];
	})() satisfies Message[];

	await collections.conversations.updateOne(
		{
			_id: convId,
		},
		{
			$set: {
				messages,
				title: conv.title,
				updatedAt: new Date(),
			},
		}
	);

	// we now build the stream
	const stream = new ReadableStream({
		async start(controller) {
			const updates: MessageUpdate[] = [];

			function update(newUpdate: MessageUpdate) {
				if (newUpdate.type !== "stream" && newUpdate.type !== "messageDone") {
					updates.push(newUpdate);
				}

				if (newUpdate.type === "stream" && newUpdate.token === "") {
					return;
				}
				controller.enqueue(JSON.stringify(newUpdate) + "\n");

				if (newUpdate.type === "finalAnswer") {
					// 4096 of spaces to make sure the browser doesn't blocking buffer that holding the response
					controller.enqueue(" ".repeat(4096));
				}
			}

			update({ type: "status", status: "started" });

			const summarizeIfNeeded = (async () => {
				if (conv.title === "New Chat" && messages.length === 1) {
					try {
						conv.title = (await summarize(newPrompt)) ?? conv.title;
						update({ type: "status", status: "title", message: conv.title });
					} catch (e) {
						console.error(e);
					}
				}
			})();

			await collections.conversations.updateOne(
				{
					_id: convId,
				},
				{
					$set: {
						messages,
						title: conv.title,
						updatedAt: new Date(),
					},
				}
			);

			let webSearchResults: WebSearch | undefined;

			if (webSearch) {
				webSearchResults = await runWebSearch(conv, newPrompt, update);
			}

			messages[messages.length - 1].webSearch = webSearchResults;

			await summarizeIfNeeded;

			let execCount = 0;
			let fullContentForDisplay: string = "";

			while (
				messages[messages.length - 1].from === "user" &&
				execCount < parseInt(N_EXECUTION_LIMIT)
			) {
				// ===== handle user message =====
				try {
					const endpoint = await model.getEndpoint();
					conv.messages = messages;
					// console.log("conv.messages (for inference): " + conv.messages)
					for await (const output of await endpoint({ conversation: conv })) {
						// if not generated_text is here it means the generation is not done
						if (!output.generated_text) {
							// else we get the next token
							if (!output.token.special) {
								update({
									type: "stream",
									token: output.token.text,
								});

								// if the last message is not from assistant, it means this is the first token
								const lastMessage = messages[messages.length - 1];

								if (lastMessage?.from !== "assistant") {
									// so we create a new message
									messages = [
										...messages,
										// id doesn't match the backend id but it's not important for assistant messages
										// First token has a space at the beginning, trim it
										{
											from: "assistant",
											content: output.token.text.trimStart(),
											webSearch: webSearchResults,
											updates: updates,
											id: (responseId as Message["id"]) || crypto.randomUUID(),
											createdAt: new Date(),
											updatedAt: new Date(),
										},
									];
								} else {
									// abort check
									const date = abortedGenerations.get(convId.toString());
									if (date && date > promptedAt) {
										break;
									}

									if (!output) {
										break;
									}

									// otherwise we just concatenate tokens
									lastMessage.content += output.token.text;
								}
							}
						} else {
							// add output.generated text to the last message
							messages = [
								...messages.slice(0, -1),
								{
									...messages[messages.length - 1],
									content: output.generated_text,
									updates: updates,
									updatedAt: new Date(),
								},
							];
							fullContentForDisplay += output.generated_text + "\n";
						}
					}
				} catch (e) {
					update({ type: "status", status: "error", message: (e as Error).message });
				}

				// Check for whether to perform code execution
				const lastMessage = messages[messages.length - 1];
				if (lastMessage.from !== "assistant") {
					throw new Error("Last message is not from the assistant");
				}
				const pattern = /<execute>([\s\S]*?)<\/execute>/;
				const match = lastMessage.content.match(pattern);

				if (match) {
					// update the last message with triggersExecution = true
					messages = [
						...messages.slice(0, -1),
						{
							...messages[messages.length - 1],
							// triggersExecution: true,
							executionType: "triggered",
							updatedAt: new Date(),
						},
					];
				}
				await collections.conversations.updateOne(
					{
						_id: convId,
					},
					{
						$set: {
							messages,
							title: conv?.title,
							updatedAt: new Date(),
						},
					}
				);
				update({
					type: "messageDone",
					text: fullContentForDisplay,
					role: "assistant",
				});

				// ===== handle code execution =====
				if (match) {
					const substringBetweenExecuteTags = match[1].trim();
					let executionOutput = "";
					try {
						const resFromJupyter = await fetch(JUPYTER_API_URL + "/execute", {
							headers: {
								"Content-Type": "application/json",
							},
							method: "POST",
							body: JSON.stringify({
								convid: convId.toString(),
								code: substringBetweenExecuteTags,
							}),
						});
						if (resFromJupyter.ok) {
							const data = await resFromJupyter.json();
							executionOutput = data["result"];
							if (data["new_kernel_created"]) {
								// update({
								// 	type: "status",
								// 	status: "error",
								// 	message:
								// 		"A new code execution kernel has been created. Previous code execution variables may not be available.",
								// });
							}
						} else {
							console.error("Request to Jupyter failed with status:", resFromJupyter.status);
							executionOutput =
								"Request to Code Execution failed with status: " +
								resFromJupyter.status +
								". Please try again.";
						}
					} catch (error) {
						console.error("Error making the request:", error);
						executionOutput = "Error making the request: " + error + ". Please try again.";
					}

					// const imgPattern = /<img[^>]*>/g;
					// detect markdown image tag ![...](...)
					const imgPattern = /!\[.*?\]\(.*?\)/g;
					let displayExecutionResult = "\n```result\n" + executionOutput + "\n```\n";
					const matchedImgs = displayExecutionResult.match(imgPattern);
					// let displayExecutionResult = "\n```result\n" + executionOutput + "\n```\n"
					if (matchedImgs) {
						for (const matchedImg of matchedImgs) {
							// close the previous block ``` before <img src="..."> tag
							// add ```result\n after the <img src="..."> tag (start a new block)
							displayExecutionResult = displayExecutionResult.replace(
								matchedImg,
								"\n```\n" + matchedImg + "\n```result\n"
							);
						}

						executionOutput = executionOutput.replace(
							imgPattern,
							"\n[An image is already displayed to the user.]\n"
						);
					}
					// remove empty result code block
					displayExecutionResult = displayExecutionResult.replace("```result\n\n```", "");

					// truncate the execution output *for the LLM* if it's too long
					if (executionOutput.length > 4000) {
						executionOutput =
							executionOutput.substring(0, 2000) +
							"\n... [Output truncated due to length]...\n" +
							executionOutput.substring(executionOutput.length - 2000);
					}

					// create a new message with the execution output
					messages = [
						...messages,
						{
							from: "user",
							content: "Execution Output:\n" + executionOutput + "\n",
							executionType: "output",
							webSearch: webSearchResults,
							updates: updates,
							id: (responseId as Message["id"]) || crypto.randomUUID(),
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					];

					await collections.conversations.updateOne(
						{
							_id: convId,
						},
						{
							$set: {
								messages,
								title: conv?.title,
								updatedAt: new Date(),
							},
						}
					);
					fullContentForDisplay += displayExecutionResult;
					update({
						type: "stream",
						token: displayExecutionResult,
					});
					execCount += 1;
				}
			}

			if (execCount >= parseInt(N_EXECUTION_LIMIT)) {
				const templatedResponse =
					"I have reached the maximum number of executions specified by the administrator (=" +
					N_EXECUTION_LIMIT +
					"). Can you assist me or ask me another question? You can also ask me to continue.";
				messages = [
					...messages,
					{
						from: "assistant",
						content: templatedResponse,
						webSearch: webSearchResults,
						updates: updates,
						id: (responseId as Message["id"]) || crypto.randomUUID(),
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				];
				await collections.conversations.updateOne(
					{
						_id: convId,
					},
					{
						$set: {
							messages,
							title: conv?.title,
							updatedAt: new Date(),
						},
					}
				);
				fullContentForDisplay += templatedResponse;
				update({
					type: "stream",
					token: messages[messages.length - 1].content,
				});
			}
			update({
				type: "finalAnswer",
				text: fullContentForDisplay,
			});

			// Assert the last message is from the assistant that did NOT triggers an execution
			const lastMessage = messages[messages.length - 1];
			if (lastMessage.from !== "assistant") {
				throw new Error("Last message is not from the assistant");
			}
			if (lastMessage.executionType === "output") {
				throw new Error("Last message is an execution output");
			}
			if (lastMessage.executionType === "triggered") {
				throw new Error("Last message is a triggered execution");
			}

			// add the fullContentForDisplay to the last message for front-end display
			messages = [
				...messages.slice(0, -1),
				{
					...messages[messages.length - 1],
					displayContent: fullContentForDisplay,
					updates: updates,
					updatedAt: new Date(),
				},
			];
			await collections.conversations.updateOne(
				{
					_id: convId,
				},
				{
					$set: {
						messages,
						title: conv?.title,
						updatedAt: new Date(),
					},
				}
			);

			return;
		},
		async cancel() {
			await collections.conversations.updateOne(
				{
					_id: convId,
				},
				{
					$set: {
						messages,
						title: conv.title,
						updatedAt: new Date(),
					},
				}
			);
		},
	});

	// Todo: maybe we should wait for the message to be saved before ending the response - in case of errors
	return new Response(stream);
}

export async function DELETE({ locals, params }) {
	const convId = new ObjectId(params.id);

	const conv = await collections.conversations.findOne({
		_id: convId,
		...authCondition(locals),
	});

	if (!conv) {
		throw error(404, "Conversation not found");
	}

	await collections.conversations.deleteOne({ _id: conv._id });

	return new Response();
}

export async function PATCH({ request, locals, params }) {
	const { title } = z
		.object({ title: z.string().trim().min(1).max(100) })
		.parse(await request.json());

	const convId = new ObjectId(params.id);

	const conv = await collections.conversations.findOne({
		_id: convId,
		...authCondition(locals),
	});

	if (!conv) {
		throw error(404, "Conversation not found");
	}

	await collections.conversations.updateOne(
		{
			_id: convId,
		},
		{
			$set: {
				title,
			},
		}
	);

	return new Response();
}
