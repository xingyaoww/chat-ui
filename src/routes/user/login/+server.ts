import type { RequestHandler } from "@sveltejs/kit";
import { serialize } from "cookie";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const POST: RequestHandler = async ({ request }) => {
	// Check for existing JWT cookie
	const cookies = request.headers.get("cookie");
	const existingToken = cookies?.includes("jwt=");
	console.log("existingToken", existingToken);
	console.log("request", request);
	if (existingToken) {
		return new Response(
			JSON.stringify({
				status: 400,
				body: { error: "User already logged in" },
			}),
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	// Process login credentials
    const { username, password } = await request.json();
    console.log("username", username);
    console.log("password", password);

	if (!username || !password) {
		return new Response(
			JSON.stringify({
				status: 400,
				body: { error: "Missing username or password" },
			}),
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	// Authenticate user and get token
	try {
		const {access_token, token_type} = await authenticateUser(username, password);
        console.log("token", {access_token, token_type});
		// Set JWT token in cookie
		return new Response(JSON.stringify({ success: true }),{
			status: 200,
			headers: {
				"Set-Cookie": serialize("jwt", `${token_type} ${access_token}`, { path: "/", httpOnly: true }),
			}
		});
	} catch (error) {
        console.log("error", error);
		return new Response(
			JSON.stringify({
				status: 401,
				body: { error: "Invalid credentials" },
			}),
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};

async function authenticateUser(username: string, password: string) {
	const response = await fetch(`${IMAGE_SERVER_URL}/token`, {
		method: "POST",
		headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ username, password }).toString()
	});

	if (!response.ok) {
        console.log("response", response);
		throw new Error("Authentication failed");
	}

	const data = await response.json();
    const access_token = data.access_token;
    const token_type = data.token_type;
	return {access_token, token_type}; // Assuming the response contains a JWT token
}
