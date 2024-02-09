import { TasksAgent } from "./TasksAgent";
import { ContextUpdater } from "./ContextUpdater";
import type { Conversation } from "$lib/types/Conversation";
import { getLessonByName } from "./lessons/combinedLessons";
import { CodeGenerator } from "./CodeGenerator";
import { CodeExecutor } from "./CodeExecutor";
import { OutputInterpreter } from "./OutputInterpreter";
import type { ObjectId } from "mongodb";
export class Coordinator {
	public taskAgent = new TasksAgent();
	public contextUpdater = new ContextUpdater();
	public codeGenerator = new CodeGenerator();
	public codeExecutor = new CodeExecutor();
	public outputInterpreter = new OutputInterpreter();
	public context = "";
	public currentTask = "";
	public code = "";
	public output = "";
	public convId: ObjectId;
	public taskList: { role: string; tools?: string[]; content: string }[] = [];
	constructor(convid: ObjectId) {
		this.taskAgent.convId = convid;
		this.contextUpdater.convId = convid;
		this.codeGenerator.convId = convid;
		this.codeExecutor.convId = convid;
		this.outputInterpreter.convId = convid;
		this.convId = convid;
	}

	public async performTask(
		newPrompt: Omit<Conversation["messages"][0], "id">,
		conversations: Omit<Conversation["messages"][0], "id">[]
	) {
		// 1. identify the task
		const task = (
			await this.taskAgent.performAction({
				messages: [
					{
						from: "user",
						content: newPrompt.content
							.split("\n")
							.filter((line) => line.includes("?"))
							.join("\n"),
					},
				],
			})
		).trim();

		this.currentTask = task;

		if (task === "Do Nothing") {
			const message = await this.outputInterpreter.performAction({
				messages: [...conversations, newPrompt],
			});
			console.log("message: ", message);
			return;
		}

		// 2. get the task list from the lesson
		const lesson = getLessonByName(task);
		this.taskList = lesson?.action_list || [];

		console.log("taskList: ", this.taskList);

		// 3. update the context
		const totalList = [...conversations, newPrompt];
		const userEndConversation = totalList
			.slice(-20)
			.filter((message) => message.from === "user")
			.map((message) => message.content)
			.join("\n");

		// this.context = await this.contextUpdater.performAction({
		// 	messages: [
		// 		{
		// 			from: "user",
		// 			content: userEndConversation,
		// 		},
		// 	],
		// });

		let tools: string[] = [];
		for (const t of this.taskList) {
			if (t.role === "code_generator") {
				tools = t.tools || [];
				this.codeGenerator.addTools(t.tools || []);
				this.code = await this.codeGenerator.performAction({
					messages: [
						...conversations,
						{
							from: "user",
							content: `\nTask: ${t.content}\nQuestion: ${newPrompt.content}`,
						},
					],
				});
				this.code = this.code.trim();

				// format the </execute to correct format
				if (this.code.endsWith("</execute")) {
					this.code = this.code.replace("</execute", "</execute>");
				}
			} else if (t.role === "code_executor") {
				console.log("execution code: ", this.code);
				this.output = await this.codeExecutor.performAction(this.code);
			} else if (t.role === "assistant") {
				this.outputInterpreter.addTools(tools);
				console.log("output: ", this.output);
				const message = await this.outputInterpreter.performAction({
					messages: [
						{
							from: "assistant",
							content: `Output: ${this.output}. Question: ${t.content}`,
						},
					],
				});
				console.log("message: ", message);
			}
		}
	}
}
