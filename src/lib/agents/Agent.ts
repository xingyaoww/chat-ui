import type { ObjectId } from "mongodb";
// Define an abstract class named Agent
export abstract class Agent<InputType, OutputType, ContextType> {
	// Abstract property to hold the inputs of the agent
	protected inputs: InputType | null = null;
	protected context: ContextType | null = null;
	public convId: ObjectId | null = null;

	// Abstract constructor that initializes the context
	constructor() {}

	// Abstract method that defines how the agent acts based on the inputs.
	// It should return an output of type OutputType.
	abstract act(): Promise<OutputType>;

	// Abstract method to print or output information
	abstract print(): void;

	// Abstract method to update the agent
	abstract update(inputs: InputType): void;

	// Abstract validator method
	abstract validateInput(inputs: InputType): boolean;

	// Abstract validator method
	abstract validateOutput(output: OutputType): boolean;

	// Orchestrator method that performs the action and then prints
	async performAction(inputs: InputType): Promise<OutputType> {
		this.inputs = inputs;
		// Validate the inputs
		if (!this.inputs || !this.validateInput(this.inputs)) {
			throw new Error("Invalid inputs");
		}
		const output = await this.act();
		this.print();
		return output;
	}
}
