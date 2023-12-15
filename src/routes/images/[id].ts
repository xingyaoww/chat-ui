import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ url }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = url.pathname.split("/")[2];
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

export const DELETE = async ({ url }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = url.pathname.split("/")[2];
		console.log("pathname", pathname);

		const response = await fetch(`${imageUrl}/images/${pathname}`, {
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
