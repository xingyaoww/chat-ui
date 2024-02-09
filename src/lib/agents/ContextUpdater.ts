import { DefaultLLMAgent, type InputType } from "./DefaultLLMAgent";

export class ContextUpdater extends DefaultLLMAgent {
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
	constructor() {
		super();
		this.context = {
			exampleConversations: [
				{
					from: "user",
					content: "<image>{'id': 'def425'} </image>\n",
				},
				{ from: "assistant", content: "Context: \nimage_id = 'def425'" },
				{
					from: "user",
					content:
						"Execution Output: {'type': 'ecole-message', 'data': 'The activity in the image is 'a person riding a horse''}\n",
				},
				{
					from: "assistant",
					content: "Context: \nimage_id = 'def425'\naction='a person riding a horse'",
				},
				{
					from: "user",
					content:
						"Execution Output: {'type': 'ecole-message', 'data': 'The attributes of 'coyote' are 'four-legged mammal', 'brown, grey, or black fur', 'pointy ears', 'a bushy tail', 'a long snout', 'sharp teeth''}",
				},
				{
					from: "assistant",
					content:
						"Context: \nimage_id = 'def425'\naction='a person riding a horse'\nattributes=['four-legged mammal', 'brown, grey, or black fur', 'pointy ears', 'a bushy tail', 'a long snout', 'sharp teeth']",
				},
				{
					from: "user",
					content: "Why do you think the activity in the image is 'a person riding a horse'?\n",
				},
				{
					from: "assistant",
					content:
						"Context: \nimage_id = 'def425'\naction='a person riding a horse'\nattributes=['four-legged mammal', 'brown, grey, or black fur', 'pointy ears', 'a bushy tail', 'a long snout', 'sharp teeth']",
				},
				{
					from: "user",
					content: "What can you do?'?\n",
				},
				{
					from: "assistant",
					content:
						"Context: \nimage_id = 'def425'\naction='a person riding a horse'\nattributes=['four-legged mammal', 'brown, grey, or black fur', 'pointy ears', 'a bushy tail', 'a long snout', 'sharp teeth']",
				},
				{
					from: "user",
					content: "Execution Output: '?\n",
				},
				{
					from: "assistant",
					content:
						"Context: \nimage_id = 'def425'\naction='a person riding a horse'\nattributes=['four-legged mammal', 'brown, grey, or black fur', 'pointy ears', 'a bushy tail', 'a long snout', 'sharp teeth']",
				},
				{
					from: "user",
					content: "reset\n",
				},
				{
					from: "assistant",
					content: "Context: \n",
				},
			],
			preprompt:
				"You are a context updater assistant. You can help update the context of a conversation. Assign all possibles values to the python type variables. If user say free context, reset the context to empty. If user uploads new images, reset the context to empty and add the new image info. If the question does not have new context, you just use the old context.\n",
		};
	}

	print(): void {
		return;
	}
}
