import type { RequestHandler } from "@sveltejs/kit";
import { VIDEO_SERVER_URL } from "$env/dynamic/private";

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const videoUrl = VIDEO_SERVER_URL;
		const requestBody = await request.formData();
		let user_id = "";
		if (locals.user?._id) {
			user_id = String(locals.user._id);
		} else if (locals.sessionId) {
			user_id = String(locals.sessionId);
		}
		const formData = new FormData();
		const blob = requestBody.get("file") as Blob;
		formData.append("file", blob);
		formData.append("user_id", user_id as string);
		// console.log("formData", formData);
		const response = await fetch(`${videoUrl}/upload_video_and_process_embedding/`, {
			method: "POST",
			body: formData,
		});
		console.log("response", response);

		const responseData = await response.json();

		const responseJSON = {
			id: responseData["video_id"],
			url: `/videos/${responseData["video_id"]}`,
		};
		return new Response(JSON.stringify(responseJSON), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
