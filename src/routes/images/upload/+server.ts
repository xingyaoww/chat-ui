import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL, IMAGE_SERVER_TOKEN } from "$env/static/private";

export const POST: RequestHandler = async ({ request }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		console.log("imageUrl", imageUrl);
		const requestBody = request.body;
		console.log("requestBody", requestBody);
		// Redirect to the FastAPI server
		const response = await fetch(`${imageUrl}/images/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/form-data",
				Authorization: `Bearer ${IMAGE_SERVER_TOKEN}`,
			},
			body: requestBody,
		});
		console.log("response", response);
		const responseData = await response.json();
		console.log("responseData", responseData);
		return new Response(JSON.stringify({ success: true }), {
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
