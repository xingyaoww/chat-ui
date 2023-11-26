import { IMAGE_SERVER_URL } from "$env/static/private";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies }) => {
	// Check for existing JWT cookie
	const existingToken = cookies.get("jwt");
	if (!existingToken) {
		return new Response(
			JSON.stringify({
				status: 400,
				body: { error: "User not logged in" },
			}),
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
	const response = await fetch(`${IMAGE_SERVER_URL}/users/me`, {
		method: "GET",
		headers: {
			Authorization: existingToken,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Error from user server: ${response.statusText}`);
	}

	const userData = await response.json();
	console.log("userData", userData);
	return new Response(JSON.stringify(userData), {
		headers: { "Content-Type": "application/json" },
	});
};
