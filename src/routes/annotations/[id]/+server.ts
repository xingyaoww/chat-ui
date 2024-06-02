import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ params }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = params.id;

		const response = await fetch(`${imageUrl}/annotations/${pathname}`);

		if (!response.ok) throw new Error(response.statusText);
		const arrayBuffer = await response.arrayBuffer();

		return new Response(arrayBuffer, {
			status: 200,
			headers: {
				"Content-Type": response.headers.get("Content-Type"), // Set the correct Content-Type for the image
			},
		});
	} catch (error) {
		await fetch(`${imageUrl}/annotations/${pathname}`, {
			method: "POST",
			body: JSON.stringify([]),
		});

		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
export const POST: RequestHandler = async ({ params }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = params.id;

		const response = await fetch(`${imageUrl}/annotations/${pathname}`, {
			method: "POST",
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

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = params.id;
		let body = [];
		try {
			// Attempt to parse the JSON body of the request
			if (request) {
				const requestBody = await request.json();
				body = requestBody;
			}
		} catch (error) {
			// Handle parsing error
			return new Response(JSON.stringify({ error: "Invalid JSON" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const response = await fetch(`${imageUrl}/annotations/${pathname}`, {
			method: "PUT",
			body: JSON.stringify(body),
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!response.ok) {
			console.log("error ", await response.text());
			throw new Error(response.statusText);
		}
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

export const DELETE = async ({ url }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = url.pathname.split("/")[2];

		const response = await fetch(`${imageUrl}/annotations/${pathname}`, {
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
