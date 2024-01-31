import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ fetch, locals }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		let user_id = "";
		if (locals.user?._id) {
			user_id = String(locals.user._id);
		} else if (locals.sessionId) {
			user_id = String(locals.sessionId);
		}

		// Assuming the image server expects a token in the headers for authentication
		const response = await fetch(`${imageUrl}/all_images/${user_id}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`Error from image server: ${response.statusText}`);
		}

		const imageData = await response.json();

		return new Response(JSON.stringify(imageData), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
