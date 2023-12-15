import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ url }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = url.pathname.split("/")[2];
		// Redirect to the FastAPI server
		if (pathname === "images" || pathname === "upload") {
			console.log("pathname", pathname);
			return new Response(undefined, {
				status: 302,
				headers: {
					location: `${imageUrl}/${pathname}`,
				},
			});
		}
		console.log("pathname", pathname);

		const response = await fetch(`${imageUrl}/images/${pathname}`);
		if (!response.ok) throw new Error(response.statusText);
		const arrayBuffer = await response.arrayBuffer();

		return new Response(arrayBuffer, {
			status: 200,
			headers: {
				"Content-Type": response.headers.get("Content-Type"), // Set the correct Content-Type for the image
				"Content-Length": response.headers.get("Content-Length"),
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
