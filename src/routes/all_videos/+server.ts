import type { RequestHandler } from "@sveltejs/kit";
import { VIDEO_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ fetch, locals }) => {
	try {
		const videoUrl = VIDEO_SERVER_URL;
		let user_id = "";
		if (locals.user?._id) {
			user_id = String(locals.user._id);
		} else if (locals.sessionId) {
			user_id = String(locals.sessionId);
		}

		// Assuming the image server expects a token in the headers for authentication
		const response = await fetch(`${videoUrl}/get_video_ids_by_user_id/${user_id}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Error from image server: ${response.statusText}`);
		}

		const videoData = await response.json();

		const returnJSON = videoData["video_ids"].map((video_id: string) => {
			return {
				id: video_id,
				url: `/videos/${video_id}`,
			};
		});

		return new Response(JSON.stringify(returnJSON), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
