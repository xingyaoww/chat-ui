<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	export let image_lists: Record<string, string>[] = [];
	let images: string[] = [];
	// download the images from the image_lists
	$: if (image_lists.length > 0) {
		images = image_lists.map((image) => image.url);
	}

	let currentIndex = 0;
	let interval: NodeJS.Timeout;

	onMount(() => {
		interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % images.length;
		}, 200);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div>
	{#if images.length > 0}
		<img src={images[currentIndex]} alt="GIF" />
	{/if}
</div>
