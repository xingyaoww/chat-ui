import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ params }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = params.id;
		console.log("pathname", pathname);

		const response = await fetch(`${imageUrl}/embeddings/${pathname}`);

		if (!response.ok) {
			return new Response("Embeddings not found", { status: response.status });
		}

		const imageBuffer = await response.arrayBuffer();
		return new Response(imageBuffer, {
			status: 200,
			headers: {
				"Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
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

		const response = await fetch(`${imageUrl}/embeddings/${pathname}`, {
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
