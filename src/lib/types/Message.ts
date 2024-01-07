import type { MessageUpdate } from "./MessageUpdate";
import type { Timestamps } from "./Timestamps";
import type { WebSearch } from "./WebSearch";

export type Message = Partial<Timestamps> & {
	from: "user" | "assistant";
	id: ReturnType<typeof crypto.randomUUID>;
	content: string;
	executionType?: "triggered" | "output";
	// message with inExecutionOutput is true & triggersExecution is true will be skipped
	// the next message with displayContent will be displayed instead, which is an aggregation of all messages with inExecutionOutput is true & triggersExecution is true
	displayContent?: string;
	updates?: MessageUpdate[];
	webSearchId?: WebSearch["_id"]; // legacy version
	webSearch?: WebSearch;
	score?: -1 | 0 | 1;
	files?: string[]; // can contain either the hash of the file or the b64 encoded image data on the client side when uploading
};
