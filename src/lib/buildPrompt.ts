import { format } from "date-fns";
import { downloadFile } from "./server/files/downloadFile";
import type { BackendModel } from "./server/models";
import type { Conversation } from "./types/Conversation";
import type { Message } from "./types/Message";
import type { WebSearch } from "./types/WebSearch";
// import { useSettingsStore } from "./stores/settings";
// import { getContext, onDestroy } from "svelte";
import curriculum from "$lib/curriculum/curriculum.json";
const addContext = (messages: Pick<Message, "from" | "content" | "files">[]) => {
	// let curriculum: Record<string, string> = {};
	// const settings = getContext("settings");

	// console.log("settings", settings);

	const lastMsg = messages.slice(-1)[0];
	if (lastMsg.from !== "user" || lastMsg.content.startsWith("Execution Output:")) return messages;
	const messagesWithoutLastUsrMsg = messages.slice(0, -1);
	const previousUserMessages = messages.filter((el) => el.from === "user").slice(0, -1);
	const previousQuestions =
		previousUserMessages.length > 0
			? `Previous questions: \n${previousUserMessages
					.map(({ content }) => `- ${content}`)
					.join("\n")}`
			: "";

	const tools = curriculum.tools;
	const rules = curriculum.rules;

	return [
		...messagesWithoutLastUsrMsg,
		{
			from: "user",
			content: `
	Remember to effectively use these tools:
	${tools.map((tool, index) => `${index + 1}. ${tool.name}`).join("\n")}

	Here are the ${rules.length} rules you should adhere to:
	${rules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}

	${previousQuestions}
	Answer the question: ${lastMsg.content}
	`,
		},
	];
};
interface buildPromptOptions {
	messages: Pick<Message, "from" | "content" | "files">[];
	id?: Conversation["_id"];
	model: BackendModel;
	locals?: App.Locals;
	webSearch?: WebSearch;
	preprompt?: string;
	files?: File[];
	curriculum?: Record<string, string>;
}

export async function buildPrompt({
	messages,
	model,
	webSearch,
	preprompt,
	id,
}: buildPromptOptions): Promise<string> {
	// add context to the prompt
	messages = addContext(messages);

	console.log("messages", messages);
	if (webSearch && webSearch.context) {
		const lastMsg = messages.slice(-1)[0];
		const messagesWithoutLastUsrMsg = messages.slice(0, -1);
		const previousUserMessages = messages.filter((el) => el.from === "user").slice(0, -1);

		const previousQuestions =
			previousUserMessages.length > 0
				? `Previous questions: \n${previousUserMessages
						.map(({ content }) => `- ${content}`)
						.join("\n")}`
				: "";
		const currentDate = format(new Date(), "MMMM d, yyyy");
		messages = [
			...messagesWithoutLastUsrMsg,
			{
				from: "user",
				content: `I searched the web using the query: ${webSearch.searchQuery}. Today is ${currentDate} and here are the results:
				=====================
				${webSearch.context}
				=====================
				${previousQuestions}
				Answer the question: ${lastMsg.content} 
				`,
			},
		];
	}
	{
	}

	// section to handle potential files input
	if (model.multimodal) {
		messages = await Promise.all(
			messages.map(async (el) => {
				let content = el.content;

				if (el.from === "user") {
					if (el?.files && el.files.length > 0 && id) {
						const markdowns = await Promise.all(
							el.files.map(async (hash) => {
								try {
									const { content: image, mime } = await downloadFile(hash, id);
									const b64 = image.toString("base64");
									return `![](data:${mime};base64,${b64})})`;
								} catch (e) {
									console.error(e);
								}
							})
						);
						content += markdowns.join("\n ");
					} else {
						// if no image, append an empty white image
						content +=
							"\n![](data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAQABADAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/igAoAKACgD/2Q==)";
					}
				}

				return { ...el, content };
			})
		);
	}
	console.log("messages", messages);

	return (
		model
			.chatPromptRender({ messages, preprompt })
			// Not super precise, but it's truncated in the model's backend anyway
			.split(" ")
			.slice(-(model.parameters?.truncate ?? 0))
			.join(" ")
	);
}
