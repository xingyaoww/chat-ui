import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL, IMAGE_SERVER_TOKEN } from "$env/static/private";
import { base } from "$app/paths";

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const token = IMAGE_SERVER_TOKEN;
		console.log("imageUrl", imageUrl);
		// Assuming the image server expects a token in the headers for authentication
		const response = await fetch(`${imageUrl}/images/me`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});
		console.log("response", response);
		if (!response.ok) {
			throw new Error(`Error from image server: ${response.statusText}`);
		}

		const imageData = await response.json();
		console.log("imageData", imageData);
		imageData.forEach((image) => {
			image.url = `${base}/images/${image.id}`;
		});
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
