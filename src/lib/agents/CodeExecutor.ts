import { Agent } from "./Agent";
import fetch from "node-fetch";
import { JUPYTER_API_URL } from "$env/static/private";

export class CodeExecutor extends Agent<string, string, null> {
	constructor() {
		super();
		this.context = null;
	}
	print(): void {
		return;
	}
	update(inputs: string): void {
		this.inputs = inputs;
		return;
	}
	validateInput(inputs: string): boolean {
		inputs;
		return true;
	}
	validateOutput(output: string): boolean {
		output;
		return true;
	}

	protected inputs: string | null = null;

	async act(): Promise<string> {
		if (!this.inputs) {
			throw new Error("Invalid inputs");
		}

		const pattern = /<execute>([\s\S]*?)<\/execute>/;
		const match = this.inputs.match(pattern);

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
						// convid: convId.toString(),
						convid: this.convId,
						code: substringBetweenExecuteTags,
					}),
				});
				if (resFromJupyter.ok) {
					const data = await resFromJupyter.json();
					executionOutput = data["result"];
					return executionOutput;
				} else {
					console.error("Request to Jupyter failed with status:", resFromJupyter.status);
					executionOutput =
						"Request to Code Execution failed with status: " +
						resFromJupyter.status +
						". Please try again.";
					return executionOutput;
				}
			} catch (error) {
				console.error("Error making the request:", error);
				executionOutput = "Error making the request: " + error + ". Please try again.";
				return executionOutput;
			}
		}
		return "No code to execute";
	}
}
