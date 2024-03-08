<script lang="ts">
	import HorizontalBarChartsCompare from "./d3figure/HorizontalBarChartsCompare.svelte";
	import {
		encodedTensorToTensor,
		checkPointInMask,
		tensorToMasksCanvas,
		maskingImage,
	} from "$lib/utils/tensor";
	import { onMount } from "svelte";
	import { base } from "$app/paths";

	export let json_data = {};
	let color_1 = "#69b3a2";
	let color_2 = "#ff0000";

	// for the first image
	let render_data1 = {};
	let maskTensor1: Uint8Array | Float32Array | Int32Array = [];
	let shape1: number[] = [0, 1, 1];
	let maskURLs1: HTMLImageElement[] = [];
	let hoverMaskIndexes1: number[] = [];
	let selectedMaskIndexes1: number[] = [];
	let imgElement1: HTMLImageElement;
	let scale1 = 1;
	$: if (imgElement1) {
		scale1 = imgElement1.width / imgElement1.naturalWidth;
	}
	function handleMouseMove1(event: MouseEvent) {
		const rect = imgElement1.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / scale1); // x position within the element.
		const y = Math.floor((event.clientY - rect.top) / scale1); // y position within the element.
		hoverMaskIndexes1 = checkPointInMask(maskTensor1, shape1, x, y);
	}
	function handleMouseClick1(event: MouseEvent) {
		const rect = imgElement1.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / scale1); // x position within the element.
		const y = Math.floor((event.clientY - rect.top) / scale1); // y position within the element.
		selectedMaskIndexes1 = checkPointInMask(maskTensor1, shape1, x, y);
	}
	function handleMouseOut1(event: MouseEvent) {
		event.preventDefault();
		hoverMaskIndexes1 = [];
	}

	// for the second image
	let render_data2 = {};
	let maskTensor2: Uint8Array | Float32Array | Int32Array = [];
	let shape2: number[] = [0, 1, 1];
	let maskURLs2: HTMLImageElement[] = [];
	let hoverMaskIndexes2: number[] = [];
	let selectedMaskIndexes2: number[] = [];
	let imgElement2: HTMLImageElement;
	let scale2 = 1;
	$: if (imgElement2) {
		scale2 = imgElement2.width / imgElement2.naturalWidth;
	}
	function handleMouseMove2(event: MouseEvent) {
		const rect = imgElement2.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / scale2); // x position within the element.
		const y = Math.floor((event.clientY - rect.top) / scale2); // y position within the element.
		hoverMaskIndexes2 = checkPointInMask(maskTensor2, shape2, x, y);
	}
	function handleMouseClick2(event: MouseEvent) {
		const rect = imgElement2.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / scale2); // x position within the element.
		const y = Math.floor((event.clientY - rect.top) / scale2); // y position within the element.
		selectedMaskIndexes2 = checkPointInMask(maskTensor2, shape2, x, y);
	}

	function handleMouseOut2(event: MouseEvent) {
		event.preventDefault();
		hoverMaskIndexes2 = [];
	}

	onMount(() => {
		// for the first image
		console.log("json_data", json_data);
		if (json_data["pred_1_id"]) {
			fetch(`${base}/ods/${json_data["pred_1_id"]}`)
				.then((res) => {
					if (!res.ok) {
						throw new Error("HTTP error, status = " + res.status);
					}
					return res.json();
				})
				.then((data) => {
					console.log("data over here", data);
					[maskTensor1, shape1] = encodedTensorToTensor(data["segmentations"]["part_masks"]);
					render_data1 = data;
					render_data1["segmentations"] = undefined;
					maskURLs1 = tensorToMasksCanvas(maskTensor1, shape1);
				});
		}

		// for the second image
		if (json_data["pred_2_id"]) {
			fetch(`${base}/ods/${json_data["pred_2_id"]}`)
				.then((res) => {
					if (!res.ok) {
						throw new Error("HTTP error, status = " + res.status);
					}
					return res.json();
				})
				.then((data) => {
					[maskTensor2, shape2] = encodedTensorToTensor(data["segmentations"]["part_masks"]);
					render_data2 = data;
					render_data2["segmentations"] = undefined;
					maskURLs2 = tensorToMasksCanvas(maskTensor2, shape2);
				});
		}
	});
</script>

<div class="flex flex-col">
	<div class="grid grid-cols-2 divide-x">
		{#if json_data.image_1}
			<div
				class="
            border-5
            relative
            w-full
            overflow-hidden
            border-gray-300
            shadow-lg"
			>
				<img
					bind:this={imgElement1}
					src={"/images/" + json_data.image_1}
					class={`w-full border-4 border-solid`}
					style="border-color: #69b3a2"
					on:mousemove={handleMouseMove1}
					on:click={handleMouseClick1}
					on:mouseleave={handleMouseOut1}
				/>

				{#each maskURLs1 as maskURL}
					<img
						src={maskURL.src}
						class="border-3 pointer-events-none absolute left-0 top-0 z-10 w-full opacity-30"
					/>
				{/each}
				{#each hoverMaskIndexes1 as index}
					<img
						src={maskURLs1[index].src}
						class="border-3 pointer-events-none absolute left-0 top-0 z-10 w-full opacity-60"
					/>
				{/each}
			</div>
		{/if}
		{#if json_data.image_2}
			<div
				class="
			border-5
			relative
			w-full
			overflow-hidden
			border-gray-300
			shadow-lg"
			>
				<img
					bind:this={imgElement2}
					src={"/images/" + json_data.image_2}
					class={`w-full border-4 border-solid`}
					style="border-color: #ff0000"
					on:mousemove={handleMouseMove2}
					on:click={handleMouseClick2}
					on:mouseleave={handleMouseOut2}
				/>

				{#each maskURLs2 as maskURL}
					<img
						src={maskURL.src}
						class="border-3 pointer-events-none absolute left-0 top-0 z-10 w-full opacity-30"
					/>
				{/each}
				{#each hoverMaskIndexes2 as index}
					<img
						src={maskURLs2[index].src}
						class="border-3 pointer-events-none absolute left-0 top-0 z-10 w-full opacity-60"
					/>
				{/each}
			</div>
		{/if}
	</div>
	<div class="grid grid-cols-2 divide-x">
		{#if json_data.concept1}
			<div class="flex w-full flex-row items-center justify-center">
				<!-- draw a rectangle -->
				<div class="mx-3 h-8 w-16 rounded-lg bg-[#69b3a2]" />
				<p>{json_data.concept1}</p>
			</div>
		{/if}
		{#if json_data.concept2}
			<div class="flex w-full items-center justify-center">
				<!-- draw a rectangle -->
				<div class="mx-3 h-8 w-16 rounded-lg bg-[#ff0000]" />
				<p>{json_data.concept2}</p>
			</div>
		{/if}
	</div>

	<div class="flex flex-col">
		{#if json_data.probs1}
			<HorizontalBarChartsCompare
				x1={json_data.probs1}
				x2={json_data.probs2}
				labels={json_data.name}
				{color_1}
				{color_2}
				name="Top Detected Attribute Difference"
			/>
		{/if}
	</div>
</div>
