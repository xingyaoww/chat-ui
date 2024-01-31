import { base } from "$app/paths";
import { error } from "@sveltejs/kit";
import npyjs from "npyjs";
import * as ort from "onnxruntime-web";

// Assuming 'PageLoad' type is correctly imported from './$types'
/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
	const { id } = params;
	const IMAGE_URL = `${base}/images/${id}`;
	const EMBEDDING_URL = `${base}/embeddings/${id}`;

	// Function to load the tensor from a npy file
	async function loadNpyTensor(tensorFile, dType) {
		const npLoader = new npyjs();
		const npArray = await npLoader.load(tensorFile);
		return new ort.Tensor(dType, npArray.data, npArray.shape);
	}

	try {
		// Load image and embedding
		const [imageResponse, embeddingResponse] = await Promise.all([
			fetch(IMAGE_URL),
			fetch(EMBEDDING_URL),
		]);

		// Check if responses are ok
		if (!imageResponse.ok) {
			throw error(404, { message: "Image not found in database. Please upload it first." });
		}
		if (!embeddingResponse.ok) {
			throw error(404, {
				message: "Image embedding is currently processing. Please try again later.",
			});
		}

		// Process image
		const blob = await imageResponse.blob();
		const imageUrl = URL.createObjectURL(blob);

		// Load embedding tensor
		const embeddingTensor = await loadNpyTensor(await embeddingResponse.arrayBuffer(), "float32");

		// Return the props
		return {
			props: {
				id: id,
				image: imageUrl,
				tensor: embeddingTensor,
			},
		};
	} catch (err) {
		console.error(err);
		// Return a more generic error to the user
		return error(500, "Internal Server Error");
	}
}
