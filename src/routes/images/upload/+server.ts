import { redirect, type RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";
import { base } from "$app/paths";

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		console.log("imageUrl", imageUrl);
		const requestBody = await request.formData();
		console.log("requestBody", requestBody);
		// Redirect to the FastAPI server
		const cookie = cookies.get("jwt");
		console.log("cookie", cookie);
		// Redirect to login if no cookie
		if (!cookie || cookie === undefined) {
			throw redirect(302, `${base}/user/login`);
		}

		// Assuming the image server expects a token in the headers for authentication
		const definedCookie = cookie as string;
		console.log("definedCookie", definedCookie);
		const formData = new FormData();
		formData.append("file", requestBody.get("file") as Blob);
		formData.append("title", "New Image");
		const response = await fetch(`${imageUrl}/images/`, {
			method: "POST",
			headers: {
				Authorization: definedCookie,
			},
			body: formData,
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
