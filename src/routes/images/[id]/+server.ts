import type { RequestHandler } from "@sveltejs/kit";
import { IMAGE_SERVER_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ url }) => {
	try {
		const imageUrl = IMAGE_SERVER_URL;
		const pathname = url.pathname.split("/")[2];
		// Redirect to the FastAPI server
		if (pathname === "images" || pathname === "upload") {
			return new Response(undefined, {
				status: 302,
				headers: {
					location: `${imageUrl}/${pathname}`,
				},
			});
		}
		return new Response(undefined, {
			status: 302,
			headers: {
				location: `${imageUrl}/images/${pathname}`,
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error as Error }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
