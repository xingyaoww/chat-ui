<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	export let image_lists: Record<string, string>[] = [];
	let images: string[] = [];
	// download the images from the image_lists
	$: if (image_lists.length > 0) {
		images = image_lists.map((image) => "/images/" + image.id);
	}

	let currentIndex = 0;
	let interval: NodeJS.Timeout;
	let localURLs: string[] = [];
	$: if (images.length > 0) {
		images.forEach((imageURL) => {
			const img = new Image();
			img.src = imageURL;
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0);
				localURLs.push(canvas.toDataURL());
			};
		});
	}

	onMount(() => {
		console.log("GifReader mounted");
		interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % images.length;
		}, 200);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div>
	Tracked Emotions
	{#if images.length > 0}
		<img src={localURLs[currentIndex]} alt="emotion" />
	{/if}
</div>
