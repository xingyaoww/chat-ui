<script>
	import { onMount } from "svelte";

	export let handleMouseMove = null;
	export let clicks = [];
	export let image = null;
	export let maskImg = null;
	let shouldFitToWidth = true;
	let imageClasses = "";
	let maskImageClasses =
		"absolute top-0 left-0 z-10 opacity-40 border-3 border-red-500 pointer-events-none";

	const fitToPage = () => {
		if (!image) return;
		const imageAspectRatio = image.width / image.height;
		const screenAspectRatio = window.innerWidth / window.innerHeight;
		shouldFitToWidth = imageAspectRatio > screenAspectRatio;
	};

	$: console.log("maskImage", maskImg);
	// Setup ResizeObserver
	onMount(() => {
		const bodyEl = document.body;
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target === bodyEl) {
					fitToPage();
				}
			}
		});

		fitToPage();
		resizeObserver.observe(bodyEl);

		return () => {
			resizeObserver.unobserve(bodyEl);
		};
	});

	// Function to handle mouse out event
	const handleMouseOut = () => {
		// Replace with your logic to defer setting maskImg to null
		maskImg = null;
	};
</script>

<div class="relative min-h-0 min-w-0">
	{#if image}
		<div
			on:mousemove={handleMouseMove}
			on:touchstart={handleMouseMove}
			on:mouseleave={handleMouseOut}
			class={(shouldFitToWidth ? "w-full" : "h-full") + " " + imageClasses}
		>
			<img src={image.src} />
		</div>
	{/if}
	{#if maskImg}
		<div class={(shouldFitToWidth ? "w-full" : "h-full") + " " + maskImageClasses}>
			<img src={maskImg.src} alt="" />
		</div>
	{/if}
</div>
