<script lang="ts">
	import { base } from "$app/paths";
	import {
		encodedTensorToTensor,
		checkPointInMask,
		tensorToMasksCanvas,
		maskingImage,
	} from "$lib/utils/tensor";
	import { onMount } from "svelte";
	import HorizontalBarChartsExplain from "./d3figure/HorizontalBarChartsExplain.svelte";

	let imgElement: HTMLImageElement;
	export let json_data = {};
	let render_data = {};
	let maskTensor: Uint8Array | Float32Array | Int32Array = [];
	let shape: number[] = [0, 1, 1];
	let maskURLs: HTMLImageElement[] = [];
	let hoverMaskIndexes: number[] = [];
	let selectedMaskIndexes: number[] = [];
	let mode = "predicted_top_k";
	let scale = 1;
	let showExplanation = false;
	$: if (imgElement) {
		scale = imgElement.width / imgElement.naturalWidth;
	}
	function handleMouseMove(event: MouseEvent) {
		const rect = imgElement.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / scale); // x position within the element.
		const y = Math.floor((event.clientY - rect.top) / scale); // y position within the element.
		hoverMaskIndexes = checkPointInMask(maskTensor, shape, x, y);
	}
	function handleMouseClick(event: MouseEvent) {
		const rect = imgElement.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / scale); // x position within the element.
		const y = Math.floor((event.clientY - rect.top) / scale); // y position within the element.
		selectedMaskIndexes = checkPointInMask(maskTensor, shape, x, y);
	}
	function handleMouseOut(event: MouseEvent) {
		event.preventDefault();
		hoverMaskIndexes = [];
	}

	onMount(() => {
		fetch(`${base}/ods/${json_data.prediction_id ? json_data.prediction_id : json_data.image_id}`)
			.then((res) => {
				if (!res.ok) {
					throw new Error("HTTP error, status = " + res.status);
				}
				return res.json();
			})
			.then((data) => {
				[maskTensor, shape] = encodedTensorToTensor(data["segmentations"]["part_masks"]);
				render_data = data;
				render_data["segmentations"] = undefined;
				maskURLs = tensorToMasksCanvas(maskTensor, shape);
			});
	});
</script>

<div>
	<div>{render_data["interpretation"]}</div>
	<button
		on:click={() => (showExplanation = !showExplanation)}
		class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
		>{showExplanation ? "Hide explanation" : "Show explanation"}</button
	>
</div>
{#if showExplanation}
	<div class="flex flex-col">
		<div class="flex w-full flex-row">
			<div
				class="
            border-5
            relative
            w-full
            overflow-hidden
            border-gray-300
            shadow-lg
    "
			>
				<img
					bind:this={imgElement}
					src={`/images/${json_data.image_id}`}
					alt="image"
					on:mousemove={handleMouseMove}
					on:click={handleMouseClick}
					on:mouseleave={handleMouseOut}
					class="border-3 w-full border-blue-500"
				/>
				{#each maskURLs as maskURL}
					<img
						src={maskURL.src}
						class="border-3 pointer-events-none absolute left-0 top-0 z-10 w-full opacity-30"
					/>
				{/each}
				{#each hoverMaskIndexes as index}
					<img
						src={maskURLs[index].src}
						class="border-3 pointer-events-none absolute left-0 top-0 z-10 w-full opacity-60"
					/>
				{/each}
			</div>
			<div class="flex w-full flex-col items-center justify-center">
				{#if "predicted_top_k" in render_data && mode === "predicted_top_k"}
					<HorizontalBarChartsExplain
						name="Top 5 Predicted Classes"
						yAxisLabel="Concept"
						lineValue={0.1}
						data={render_data["predicted_top_k"]}
					/>
				{:else if "total_score" in render_data && mode === "total_score"}
					<HorizontalBarChartsExplain
						name="Total Scores"
						data={render_data["total_score"]}
						windowWidth={500}
					/>
				{/if}
				<div>
					<button
						on:click={() => (mode = "predicted_top_k")}
						class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
						>Top 5 Predicted Classes</button
					>
					<button
						on:click={() => (mode = "total_score")}
						class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
						>Attributed Scores</button
					>
				</div>
			</div>
		</div>
		{#if "trained_attr_img_scores" in render_data && "zs_attr_img_scores" in render_data}
			<div class="relative flex w-full w-full flex-row py-2">
				<HorizontalBarChartsExplain
					name="General Attributes: Image"
					data={render_data["trained_attr_img_scores"]
						.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
						.slice(0, Math.min(5, render_data["trained_attr_img_scores"].length))}
				/>
				<HorizontalBarChartsExplain
					name="Concept Specific Attributes: Image"
					data={render_data["zs_attr_img_scores"]
						.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
						.slice(0, Math.min(5, render_data["zs_attr_img_scores"].length))}
				/>
			</div>
		{/if}
		<div class="relative">
			{#if selectedMaskIndexes.length > 0}
				<div class="w-full text-center">
					<h1>Selected Regions</h1>
				</div>
				{#each selectedMaskIndexes as index}
					<div
						class="
            flex
            flex-col items-center
            justify-center border-gray-300 shadow-lg"
					>
						<img src={maskingImage(imgElement, maskURLs[index])} class="w-[200px]" />
						<!-- <h3>Region Matching Score: {render_data["region_scores"][index]}</h3> -->
					</div>
					<div class="relative flex w-full w-full flex-row py-2">
						<HorizontalBarChartsExplain
							name="General Attributes: Regions"
							data={render_data["trained_attr_region_scores"][index]
								? render_data["trained_attr_region_scores"][index]
										.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
										.slice(0, Math.min(5, render_data["trained_attr_region_scores"][index].length))
								: []}
						/>

						<HorizontalBarChartsExplain
							name="Concept Specific Attributes: Region"
							data={render_data["zs_attr_region_scores"][index]
								? render_data["zs_attr_region_scores"][index]
										.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
										.slice(0, Math.min(5, render_data["zs_attr_region_scores"][index].length))
								: []}
						/>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
