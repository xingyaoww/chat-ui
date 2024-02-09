<script lang="ts">
	import { goto } from "$app/navigation";
	import ImageSegment from "./ImageSegment.svelte";
	import { base } from "$app/paths";

	export let json = {
		url: "https://via.placeholder.com/400x400",
		id: "1234",
	};
</script>

<div class="video">
	<video width="640" height="480" controls muted autoplay playsinline>
		<source src={base + json.url} type="video/mp4" />
		Your browser does not support the video tag.
	</video>
	<!-- <iframe
		width="320"
		height="240"
		src={base + json.url}
		title="Video Player"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
		allowfullscreen
	/> -->
</div>
