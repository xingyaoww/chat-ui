import type { InputType } from "./DefaultLLMAgent";
import { DefaultLLMAgent } from "./DefaultLLMAgent";
import { getTasksExamples } from "./lessons/combinedLessons";

export class TasksAgent extends DefaultLLMAgent {
	constructor() {
		super();
		const { flattenPromptList, lessonNames } = getTasksExamples();
		this.context = {
			exampleConversations: flattenPromptList,
			preprompt: `You are a task classification assistant. You can help classify a question to a problem. You currently have the following task: ${lessonNames}.`,
		};
	}
	print(): void {
		return;
	}
	update(inputs: InputType): void {
		this.inputs = inputs;
		return;
	}
	validateInput(inputs: InputType): boolean {
		inputs;
		return true;
	}
	validateOutput(output: string): boolean {
		output;
		return true;
	}
}
