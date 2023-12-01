import { base } from "$app/paths";
import { IMAGE_SERVER_URL } from "$env/static/private";
import { redirect, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Check for existing JWT cookie
	const existingToken = cookies.get("jwt");
	console.log("existingToken", existingToken);
	console.log("request", request);
	if (existingToken && existingToken !== "undefined") {
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
		const { access_token, token_type, refresh_token } = await authenticateUser(username, password);
		console.log("token", { access_token, token_type });
		// Set JWT token in cookie

		cookies.set("jwt", `${token_type} ${access_token}`, {
			path: "/",
			httpOnly: true,
		});
		cookies.set("refresh_token", `${token_type} ${refresh_token}`, {
			path: "/",
			httpOnly: true,
		});
		console.log("cookies", cookies);
		// Set JWT token in cookie
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {},
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

// Authenticate user and get token
async function authenticateUser(username: string, password: string) {
	// Authenticate user and get token
	const response = await fetch(`${IMAGE_SERVER_URL}/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({ username, password }).toString(),
	});

	// If the credentials are invalid, throw an error
	if (!response.ok) {
		console.log("response", response);
		throw new Error("Authentication failed");
	}

	// If the credentials are valid, return the token
	const data = await response.json();
	const access_token = data.access_token;
	const refresh_token = data.refresh_token;
	const token_type = data.token_type;
	return { access_token, token_type, refresh_token }; // Assuming the response contains a JWT token
}

export const GET = async ({ cookies, fetch }) => {
	// Check for existing JWT cookie
	const existingToken = cookies.get("jwt");
	if (!existingToken || existingToken === "undefined") {
		return new Response(JSON.stringify({ error: "User not logged in" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	// Verify the access token
	const response = await fetch(`${IMAGE_SERVER_URL}/users/verify_access_token/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ access_token: existingToken }),
	});

	// If the access token is invalid, try to refresh it
	if (!response.ok) {
		// Check for existing refresh token
		const existingRefreshToken = cookies.get("refresh_token");
		if (!existingRefreshToken || existingRefreshToken === "undefined") {
			cookies.delete("jwt", { path: "/" });
			cookies.delete("refresh_token", { path: "/" });
			throw redirect(302, `${base}/user/login`);
		}
		const verifyRefreshToken = await fetch(`${IMAGE_SERVER_URL}/users/verify_refresh_token/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ refresh_token: existingRefreshToken }),
		});

		// If the refresh token is invalid, redirect to login
		if (!verifyRefreshToken.ok) {
			cookies.delete("jwt", { path: "/" });
			cookies.delete("refresh_token", { path: "/" });
			throw redirect(302, `${base}/user/login`);
		}

		// Refresh the access token
		const refreshResponse = await fetch(`${IMAGE_SERVER_URL}/token/refresh/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ refresh_token: cookies.get("refresh_token") }),
		});

		// If the refresh token is invalid, redirect to login
		if (!refreshResponse.ok) {
			cookies.delete("jwt", { path: "/" });
			cookies.delete("refresh_token", { path: "/" });
			throw redirect(302, `${base}/user/login`);
		}

		// Set the new access token in the cookie
		const data = await refreshResponse.json();
		const access_token = data.access_token;
		const token_type = data.token_type;
		cookies.set("jwt", `${token_type} ${access_token}`, {
			path: "/",
			httpOnly: true,
		});
	}

	// Process login credentials
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: {},
	});
};