<script lang="ts">
	import { afterUpdate, onDestroy } from "svelte";
	export let json_data = null;
	import { base } from "$app/paths";
	import { encodedTensorToTensor, tensorToHeatmapCanvas } from "$lib/utils/tensor";

	let parsedJson = null;
	let heatmap1 = null;
	let heatmap2 = null;
	let concept1 = null;
	let concept2 = null;

	afterUpdate(() => {
		parsedJson = json_data;
		if (parsedJson !== null) {
			console.log(parsedJson);
			console.log(`${base}/ods/${parsedJson["url_1"].split("/")[1]}`);
			if (parsedJson.url_1) {
				fetch(`${base}/ods/${parsedJson["url_1"].split("/")[1]}`)
					.then((response) => response.json())
					.then((json) => {
						let shapeHeatmap = [0, 1, 1];
						let heatmapTensor = [];
						[heatmapTensor, shapeHeatmap] = encodedTensorToTensor(json["heatmap"]);
						heatmap1 = tensorToHeatmapCanvas(heatmapTensor, shapeHeatmap);
						concept1 = json["name"];
					});
			}
			if (parsedJson.url_2) {
				fetch(`${base}/ods/${parsedJson["url_2"].split("/")[1]}`)
					.then((response) => response.json())
					.then((json) => {
						let shapeHeatmap = [0, 1, 1];
						let heatmapTensor = [];
						[heatmapTensor, shapeHeatmap] = encodedTensorToTensor(json["heatmap"]);
						heatmap2 = tensorToHeatmapCanvas(heatmapTensor, shapeHeatmap);
						concept2 = json["name"];
					});
			}
		}
	});
	onDestroy(() => {
		heatmap1 = null;
		heatmap2 = null;
		concept1 = null;
		concept2 = null;
	});
</script>

<div class="flex flex-col">
	<div class="grid grid-cols-2 divide-x">
		{#if concept1}
			<div class="flex w-full flex-row items-center justify-center">
				<!-- draw a rectangle -->
				<div class="mx-3 h-8 w-16 rounded-lg bg-[#69b3a2]" />
				<p>{concept1}</p>
			</div>
		{/if}
		{#if concept2}
			<div class="flex w-full items-center justify-center">
				<!-- draw a rectangle -->
				<div class="mx-3 h-8 w-16 rounded-lg bg-[#D55E00]" />
				<p>{concept2}</p>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-2">
		{#if heatmap1}
			<div class="justirfy-center flex w-full flex-row items-center">
				<img
					src={heatmap1}
					alt="heatmap1"
					class={`w-[80%] border-4 border-solid`}
					style="border-color: #69b3a2"
				/>
			</div>
		{/if}
		{#if heatmap2}
			<div class="justirfy-center flex w-full flex-row items-center">
				<img
					src={heatmap2}
					alt="heatmap2"
					class={`w-[80%] border-4 border-solid`}
					style="border-color: #D55E00"
				/>
			</div>
		{/if}
	</div>
</div>
