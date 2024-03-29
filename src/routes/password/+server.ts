import type { RequestHandler } from "@sveltejs/kit";
import { ECOLE_PASSWORD } from "$env/static/private";

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const password = body.password;

	// Check if the password matches the environment variable
	if (password && password === ECOLE_PASSWORD) {
		// Redirect to the main page

		console.log("Password correct, redirecting to main page");
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": "ECOLE_password=" + password + "; Path=/; HttpOnly; SameSite=Strict",
			},
		});
	} else {
		// Password is incorrect, return an error response
		console.log("Password incorrect");
		console.log("Password:" + password);
		return new Response(JSON.stringify({ error: "Incorrect password" }), {
			status: 401,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": "ECOLE_password=; Path=/; HttpOnly; SameSite=Strict",
			},
		});
	}
};
