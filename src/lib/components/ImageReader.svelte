<script lang="ts">
	import { goto } from "$app/navigation";
	import ImageSegment from "./ImageSegment.svelte";
	import { base } from "$app/paths";

	export let json = {
		url: "https://via.placeholder.com/400x400",
		id: "1234",
	};
	let segmentMode = false;
	$: console.log("json", json);
	const handleAnnotationClick = () => {
		console.log("Edit Image", json.id);
		goto(`${base}/segmentation/${json.id}`);
	};

	const handleSegmentationClick = () => {
		segmentMode = !segmentMode;
	};
</script>

<div class="image">
	{#if segmentMode}
		<ImageSegment on:segmentImageUpload {json} />
	{:else}
		<img
			class="img"
			src={base + "/images/" + json.id}
			style="
			position: relative;
			width: 400px;
		"
		/>
	{/if}
	<button
		class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
		on:click={handleAnnotationClick}
	>
		Open Image In Annotation Tool
	</button>
	<button
		class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
		on:click={handleSegmentationClick}
	>
		{#if segmentMode}
			Exit Segmentation Mode
		{:else}
			Segment Image
		{/if}
	</button>
</div>
