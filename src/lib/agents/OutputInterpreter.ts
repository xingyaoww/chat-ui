import type { InputType } from "./DefaultLLMAgent";
import { DefaultLLMAgent } from "./DefaultLLMAgent";
import { getTool } from "./tools/combinedTools";
import type { Tool } from "./tools/combinedTools";

export class OutputInterpreter extends DefaultLLMAgent {
	public tools: Tool[] = [];
	constructor() {
		super();
		this.context = {
			exampleConversations: [],
			preprompt: `You are a helpful assistant. Your goal is to answer the user's question in natural language.`,
		};
	}
	print(): void {
		return;
	}
	addTools(tools: string[]): void {
		const listTools = tools.map((tool) => getTool(tool)).filter((tool) => tool !== undefined);
		this.tools = listTools.filter((tool) => tool !== undefined) as Tool[];
		this.context = {
			exampleConversations: this.tools
				.map((tool) =>
					tool.example_conversation_prompt
						.flat()
						.filter((value) => value.role === "output" || value.role === "assistant")
				)
				.flat()
				.map((value) => ({
					from: value.role === "output" ? "user" : "assistant",
					content: value.content,
				})),
			preprompt: `You are a LLM interpreter. Your goal is to interpret the input in natural language.`,
		};
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
