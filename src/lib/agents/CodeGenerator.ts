import type { InputType } from "./DefaultLLMAgent";
import { DefaultLLMAgent } from "./DefaultLLMAgent";

import { getTool } from "./tools/combinedTools";
import type { Tool } from "./tools/combinedTools";

export class CodeGenerator extends DefaultLLMAgent {
	public tools: Tool[] = [];
	constructor() {
		super();
		this.context = {
			exampleConversations: [],
			preprompt: `You are a code generation assistant. You can help generate code for a given task. You currently have the following tools: ${this.tools}.`,
		};
	}
	print(): void {
		return;
	}
	update(inputs: InputType): void {
		this.inputs = inputs;
		return;
	}
	addTools(tools: string[]): void {
		const listTools = tools.map((tool) => getTool(tool)).filter((tool) => tool !== undefined);
		this.tools = listTools.filter((tool) => tool !== undefined) as Tool[];
		const tools_description = this.tools
			.map((tool, i) => {
				const variableList = tool.variables
					.map((variable) => `${variable.name}: ${variable.description}`)
					.join("\n");
				return `${i + 1}. ${tool.name}\nVariables: ${variableList}\n`;
			})
			.join("\n\n");
		this.context = {
			exampleConversations: this.tools
				.map((tool) =>
					tool.example_conversation_prompt
						.flat()
						.filter((value) => value.role === "task" || value.role === "code")
				)
				.flat()
				.map((value) => ({
					from: value.role === "task" ? "user" : "assistant",
					content:
						value.role === "task" ? value.content : "<execute>" + value.content + "</execute>",
				})),
			preprompt: `You are a code generation assistant. You can help generate Python code for a given task. Do not declare new functions, only use available functions. Your code are wrapped in <execute> tags. You currently have the following tools: ${tools_description}.`,
		};
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
