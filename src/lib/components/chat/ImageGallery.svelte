<script lang="ts" context="module">
	export type Image = {
		id: string;
		url: string;
	};
</script>

<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import ImagePreview from "../ImagePreview.svelte";

	export let onSelectImage: (image: Image) => void;

	export let images: Array<Image> = [];

	let selectedImage: Image | null = null;

	async function fetchAllOriginalImages() {
		console.log("fetching images");
		const responseFetch = await fetch(`${base}/all_images`, {
			method: "GET",
			headers: {
				accept: "application/json",
			},
		});
		console.log("response", responseFetch);

		if (responseFetch.ok) {
			const result = await responseFetch.json();
			images = result;
		} else {
			console.log("Could not fetch all images URLs");
			images = [];
		}
	}

	function selectImage(image: Image) {
		selectedImage = image;
		onSelectImage(image);
	}
	onMount(async () => {
		await fetchAllOriginalImages();
	});
</script>

<div
	class="image-gallery mb-6 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm dark:border-gray-600"
>
	{#each images as image}
		<ImagePreview
			json={image}
			on:deleteImage={() => {
				fetchAllOriginalImages();
			}}
			mode={"1"}
			clickHandler={() => selectImage(image)}
		/>
	{/each}
</div>

<style>
	.image-gallery {
		display: flex;
		overflow-x: scroll;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
	}

	img {
		scroll-snap-align: center;
		max-height: 100px;
		margin-right: 10px;
		cursor: pointer;
	}

	img.selected {
		border: 2px solid red;
	}
</style>
