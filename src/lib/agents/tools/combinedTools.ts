import tool_0 from "./tool_0.json";
import tool_1 from "./tool_1.json";
import tool_2 from "./tool_2.json";
import tool_3 from "./tool_3.json";
import tool_4 from "./tool_4.json";
import tool_5 from "./tool_5.json";
import tool_6 from "./tool_6.json";
import tool_7 from "./tool_7.json";
import tool_8 from "./tool_8.json";

export const combinedTools = [
	tool_0,
	tool_1,
	tool_2,
	tool_3,
	tool_4,
	tool_5,
	tool_6,
	tool_7,
	tool_8,
];

export interface Tool {
	name: string;
	example_code: string[];
	example_conversation_prompt: { role: string; content: string }[][];
	variables: {
		name: string;
		description: string;
	}[];
}

export const getTool = (name: string): Tool | undefined => {
	return combinedTools.find((tool) => tool.name === name);
};
