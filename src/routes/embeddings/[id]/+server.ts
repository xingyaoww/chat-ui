import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ params }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = params.id;

		const response = await fetch(`${imageUrl}/embeddings/${pathname}`);

		if (!response.ok) {
			const response_2 = await fetch(`${imageUrl}/images/${pathname}`);
			if (!response_2.ok) throw new Error(response.statusText);
			const imageBuffer = await response_2.arrayBuffer();
			const formData = new FormData();
			formData.append("file", imageBuffer);
			const response_3 = await fetch(`${imageUrl}/embeddings/`, {
				method: "POST",
				body: formData,
			});
			if (!response_3.ok) throw new Error(response.statusText);
			const responseData = await response_3.arrayBuffer();
			return new Response(responseData, {
				status: 200,
				headers: {
					"Content-Type": response_3.headers.get("Content-Type") || "application/octet-stream", // Set the correct Content-Type for the image
				},
			});
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
