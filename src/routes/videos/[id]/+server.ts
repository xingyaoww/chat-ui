import type { RequestHandler } from "@sveltejs/kit";
import { VIDEO_SERVER_URL } from "$env/dynamic/private";
import fetch from "node-fetch"; // Ensure you have node-fetch installed if running in a Node environment

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const videoUrl = VIDEO_SERVER_URL;
		const pathname = params.id;
		const range = request.headers.get("range");

		// Forward the range header to the video server
		const response = await fetch(`${videoUrl}/videos/${pathname}`, {
			headers: range ? { Range: range } : {},
		});

		if (!response.ok) throw new Error(response.statusText);

		// Forward the response headers to the client, including necessary headers for partial content
		const headers = new Headers();
		for (const [key, value] of response.headers) {
			if (
				key.startsWith("content-length") ||
				key.startsWith("content-range") ||
				key.startsWith("accept-ranges")
			) {
				headers.set(key, value);
			}
		}
		headers.set("Content-Type", "video/mp4");

		// Stream the response back to the client
		const body = response.body;

		return new Response(body, {
			status: response.status,
			headers: headers,
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const DELETE = async ({ params }) => {
	try {
		const videoUrl = VIDEO_SERVER_URL;
		const pathname = params.id;

		const response = await fetch(`${videoUrl}/images/${pathname}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error(response.statusText);
		const responseData = await response.json();

		return new Response(JSON.stringify(responseData), {
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
