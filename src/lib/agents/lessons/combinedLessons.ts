import lesson_0 from "./lesson_0.json";
import lesson_1 from "./lesson_1.json";
import lesson_2 from "./lesson_2.json";
import lesson_3 from "./lesson_3.json";
import lesson_4 from "./lesson_4.json";
import lesson_5 from "./lesson_5.json";
import lesson_6 from "./lesson_6.json";
import lesson_7 from "./lesson_7.json";
import lesson_8 from "./lesson_8.json";
import lesson_9 from "./lesson_9.json";
import lesson_10 from "./lesson_10.json";
import lesson_11 from "./lesson_11.json";
import type { Conversation } from "$lib/types/Conversation";

export const combinedLessons = [
	lesson_0,
	lesson_1,
	lesson_2,
	lesson_3,
	lesson_4,
	lesson_5,
	lesson_6,
	lesson_7,
	lesson_8,
	lesson_9,
	lesson_10,
	lesson_11,
];

export const getTasksExamples = () => {
	const lessonNames = combinedLessons.map((lesson) => `'${lesson.name}'`).join(", ");
	const promptList: Omit<Conversation["messages"][0], "id">[][] = [];
	combinedLessons.forEach((lesson) => {
		lesson.example_questions.forEach((exampleQuestion) => {
			promptList.push([
				{
					from: "user",
					content: exampleQuestion,
				},
				{
					from: "assistant",
					content: lesson.name,
				},
			]);
		});
	});

	// Flatten the array
	const flattenPromptList: Omit<Conversation["messages"][0], "id">[] = promptList
		.sort(() => Math.random() - 0.5)
		.reduce((acc, sublist) => [...acc, ...sublist], []);
	return { flattenPromptList, lessonNames };
};

export const getLessonByName = (name: string) => {
	return combinedLessons.find((lesson) => lesson.name === name);
};
