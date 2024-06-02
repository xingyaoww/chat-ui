import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/dynamic/private";

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const requestBody = await request.formData();
		let user_id = "";
		if (locals.user?._id) {
			user_id = String(locals.user._id);
		} else if (locals.sessionId) {
			user_id = String(locals.sessionId);
		}
		console.log("user_id", user_id);
		const formData = new FormData();
		const blob = requestBody.get("file") as Blob;
		formData.append("file", blob);
		formData.append("user_id", user_id as string);
		// console.log("formData", formData);
		const response = await fetch(`${imageUrl}/images/`, {
			method: "POST",
			body: formData,
		});
		console.log("response", response);

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
