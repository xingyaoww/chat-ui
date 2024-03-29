import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import { error } from "@sveltejs/kit";
import { authCondition } from "$lib/server/auth";
import { UrlDependency } from "$lib/types/UrlDependency";
import { ECOLE_PASSWORD } from "$env/static/private";
import { redirect } from "@sveltejs/kit";
import { base } from "$app/paths";

export const load = async ({ params, depends, locals }) => {
	let conversation;
	let shared = false;
	const ECOLE_password = locals.ECOLE_password;
	console.log("ECOLE_password", ECOLE_password);
	if (!ECOLE_password || ECOLE_password !== ECOLE_PASSWORD) {
		throw redirect(302, `${base}/password`);
	}

	// if the conver
	if (params.id.length === 7) {
		// shared link of length 7
		conversation = await collections.sharedConversations.findOne({
			_id: params.id,
		});
		shared = true;

		if (!conversation) {
			throw error(404, "Conversation not found");
		}
	} else {
		// todo: add validation on params.id
		conversation = await collections.conversations.findOne({
			_id: new ObjectId(params.id),
			...authCondition(locals),
		});

		depends(UrlDependency.Conversation);

		if (!conversation) {
			const conversationExists =
				(await collections.conversations.countDocuments({
					_id: new ObjectId(params.id),
				})) !== 0;

			if (conversationExists) {
				throw error(
					403,
					"You don't have access to this conversation. If someone gave you this link, ask them to use the 'share' feature instead."
				);
			}

			throw error(404, "Conversation not found.");
		}
	}
	return {
		messages: conversation.messages,
		title: conversation.title,
		model: conversation.model,
		preprompt: conversation.preprompt,
		shared,
	};
};
