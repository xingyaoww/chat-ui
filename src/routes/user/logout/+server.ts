import type { RequestHandler } from "@sveltejs/kit";

// clear the cookie
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		// Set JWT token in cookie
		if (cookies.get("jwt")) {
			console.log("cookies to delete", cookies.get("jwt"));
			cookies.delete("jwt", { path: "/" });
			console.log("cookies to delete done", cookies.get("jwt"));
		}

		if (cookies.get("refresh_token")) {
			console.log("cookies to delete", cookies.get("refresh_token"));
			cookies.delete("refresh_token", { path: "/" });
			console.log("cookies to delete done", cookies.get("refresh_token"));
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
