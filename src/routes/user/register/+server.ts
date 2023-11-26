import { IMAGE_SERVER_URL } from "$env/static/private";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Check for existing JWT cookie
	console.log("cookies", cookies);

	const existingToken = cookies?.get("jwt");
	console.log("existingToken", existingToken);
	console.log("request", request);
	if (existingToken) {
		return new Response(JSON.stringify({ error: "User already logged in" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	// Process login credentials
	const { username, password } = await request.json();
	console.log("username", username);
	console.log("password", password);

	if (!username || !password) {
		return new Response(
			JSON.stringify({
				body: { error: "Missing username or password" },
			}),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	// Authenticate user and get token
	try {
		const { access_token, token_type } = await registerUser(username, password);

		// Set JWT token in cookie

		cookies.set("jwt", `${token_type} ${access_token}`, {
			path: "/",
			httpOnly: true,
		});
		console.log("cookies", cookies);
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {},
		});
	} catch (error) {
		console.log("error", error);
		const { message } = error as Error;
		return new Response(JSON.stringify({ error: message }), {
			status: 401,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
};

async function registerUser(username: string, password: string) {
	const response = await fetch(`${IMAGE_SERVER_URL}/users`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ username, password }),
	});

	if (!response.ok) {
		const error = await response.json();
		console.log("error", error);
		throw new Error(error.detail);
	}

	const { access_token, token_type } = await fetch(`${IMAGE_SERVER_URL}/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({ username, password }).toString(),
	})
		.then((res) => res.json())
		.catch((err) => {
			console.log("err", err);
			throw new Error("Register user failed");
		});
	return { access_token, token_type }; // Assuming the response contains a JWT token
}
