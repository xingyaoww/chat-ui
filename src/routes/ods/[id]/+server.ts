import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ params }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = params.id;
		const url = `${imageUrl}/object_detection-json/${pathname}`;
		console.log(url);
		const response = await fetch(url);

		if (!response.ok) {
			console.log("response not ok");
			return new Response(JSON.stringify({ error: response.statusText }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		} else {
			const responseData = await response.json();
			return new Response(JSON.stringify(responseData), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}
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

		const response = await fetch(`${imageUrl}/object_detection-json/${pathname}`, {
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
