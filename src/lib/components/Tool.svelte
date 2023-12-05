<script>
	import { onMount } from "svelte";
	export let handleMouseMove = null;
	export let handleMouseClick = null;
	export let handleMouseOut = null;
	export let image = null;
	export let maskImg = null;
	export let savedClicks = [];
	export let savedMaskImgs = [];

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
</script>

<div class="relative min-h-0 min-w-0">
	{#if image}
		<div
			on:mousemove={handleMouseMove}
			on:touchstart={handleMouseMove}
			on:mouseleave={handleMouseOut}
			on:mousedown={handleMouseClick}
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
	{#if savedMaskImgs}
		{#each savedMaskImgs as savedMaskImg}
			<div class={(shouldFitToWidth ? "w-full" : "h-full") + " " + maskImageClasses}>
				<img src={savedMaskImg.src} alt="" />
			</div>
		{/each}
	{/if}
	<div class="border-3 pointer-events-none absolute left-0 top-0 z-10 h-full w-full border-red-500">
		{#if savedClicks}
			{#each savedClicks as savedClick}
				<div
					class={"border-3 absolute z-10 h-4 w-4 rounded-full " +
						(savedClick.click.clickType === 1 ? "bg-blue-500" : "bg-red-500")}
					style="left: {savedClick.click.x}px; top: {savedClick.click.y}px;"
				/>
			{/each}
		{/if}
	</div>
</div>
