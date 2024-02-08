import { Agent } from "./Agent";
import { generateFromDefaultEndpoint } from "$lib/server/generateFromDefaultEndpoint";
import type { Conversation } from "$lib/types/Conversation";

export interface InputType {
	messages: Omit<Conversation["messages"][0], "id">[];
}
export interface ContextType {
	exampleConversations: Omit<Conversation["messages"][0], "id">[];
	preprompt?: string;
}

export abstract class DefaultLLMAgent extends Agent<InputType, string, ContextType> {
	protected inputs: InputType | null = null;
	protected context: ContextType | null = null;

	async act(): Promise<string> {
		if (!this.inputs || !this.context) {
			throw new Error("Invalid inputs");
		}
		const { messages } = this.inputs;
		const { exampleConversations, preprompt } = this.context;

		const totalMessages = [...exampleConversations, ...messages];
		return await generateFromDefaultEndpoint({ messages: totalMessages, preprompt });
	}
}
