import type { RequestHandler } from "@sveltejs/kit";
import { serialize } from "cookie";

// clear the cookie
export const GET: RequestHandler = async ({}) => {
	try {
		// Set JWT token in cookie
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				"Set-Cookie": serialize("jwt", "", { path: "/", httpOnly: true }),
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
