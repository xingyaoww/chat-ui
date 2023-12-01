<script lang="ts">
	import Tool from "./Tool.svelte";
	import { throttle } from "lodash-es"; // Ensure lodash-es is installed
	import { createEventDispatcher } from "svelte";

	export let image: unknown = null;
	export let maskImg: unknown = null;
	export let clicks: unknown = null;
	function getClick(x: number, y: number) {
		const clickType = 1;
		return { x, y, clickType };
	}

	const dispatch = createEventDispatcher();
	function handleMouseMove(event: MouseEvent) {
		if (!event.target) return;
		console.log("handleMouseMove");
		let el = event.target as HTMLElement; // Type assertion
		const rect = el.getBoundingClientRect();
		let x = event.clientX - rect.left;
		let y = event.clientY - rect.top;
		const imageScale = image ? image.width / el.offsetWidth : 1;
		x *= imageScale;
		y *= imageScale;
		const click = getClick(x, y);
		dispatch("mouseClick", { click: click });
	}

	const throttledMouseMove = throttle(handleMouseMove, 15);
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="relative flex h-[90%] w-[90%] items-center justify-center">
		<Tool handleMouseMove={throttledMouseMove} {clicks} {image} {maskImg} />
	</div>
</div>
