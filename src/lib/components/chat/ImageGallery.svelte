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
	export let maxVideos = 5;
	export let maxImages = 5;
	let shownImages = [];

	let selectedImage: Image | null = null;

	async function fetchAllOriginalImages() {
		const responseFetch = await fetch(`${base}/all_images`, {
			method: "GET",
			headers: {
				accept: "application/json",
			},
		});

		if (responseFetch.ok) {
			const result = await responseFetch.json();
			images = images.concat(result).reverse();
			// reverse the order of images
		} else {
			console.log("Could not fetch all images URLs");
			images = [];
		}
	}
	async function fetchAllVideos() {
		const responseFetch = await fetch(`${base}/all_videos`, {
			method: "GET",
			headers: {
				accept: "application/json",
			},
		});

		if (responseFetch.ok) {
			const result = await responseFetch.json();
			images = images.concat(result);
		} else {
			console.log("Could not fetch all videos URLs");
		}
	}

	function selectImage(image: Image) {
		selectedImage = image;
		onSelectImage(image);
	}
	onMount(async () => {
		await fetchAllVideos();
		await fetchAllOriginalImages();
	});
</script>

<div
	class="image-gallery mb-6 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm dark:border-gray-600"
>
	{#each images as image}
		<ImagePreview
			json={image.url && image.url.includes("videos")
				? { ...image, url: "/thumbnails/" + image.id }
				: image}
			on:deleteImage={async () => {
				if (image.url.includes("videos")) {
					await fetch(`${base}/videos/${image.id}`, {
						method: "DELETE",
						headers: {
							accept: "application/json",
						},
					});
				} else {
					await fetch(`${base}/images/${image.id}`, {
						method: "DELETE",
						headers: {
							accept: "application/json",
						},
					});
				}
				images = [];
				await fetchAllOriginalImages();
				await fetchAllVideos();
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
