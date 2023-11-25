import { redirect, type RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";
import { base } from "$app/paths";
import type { Image } from "$lib/components/chat/ImageGallery.svelte";

export const GET: RequestHandler = async ({ fetch, cookies }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const tokenCookie = cookies.get("jwt");
		if (!tokenCookie) {
			// redirect to login
			throw redirect(302, `${base}/user/login`);
		}

		// Assuming the image server expects a token in the headers for authentication
		const response = await fetch(`${imageUrl}/images/me`, {
			method: "GET",
			headers: {
				Authorization: tokenCookie,
				"Content-Type": "application/json",
			},
		});
		console.log("response", response);
		if (!response.ok) {
			throw new Error(`Error from image server: ${response.statusText}`);
		}

		const imageData = await response.json();
		console.log("imageData", imageData);
		imageData.forEach((image: Image) => {
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
