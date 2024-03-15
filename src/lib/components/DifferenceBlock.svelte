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
	let weighted = true;
	type Pair = {
		name: string;
		value: number;
	};

	// for the first image
	let render_data1 = {};
	let maskTensor1: Uint8Array | Float32Array | Int32Array = [];
	let shape1: number[] = [0, 1, 1];
	let maskURLs1: HTMLImageElement[] = [];
	let hoverMaskIndexes1: number[] = [];
	let selectedMaskIndexes1: number[] = [];
	let imgElement1: HTMLImageElement;
	let scale1 = 1;

	function sigmoid(z) {
		return 1 / (1 + Math.exp(-z));
	}
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
	function selectedData(
		keys: Array<string>,
		pred1: Array<number>,
		pred2: Array<number>,
		weight1: Array<number> | null = null,
		weight2: Array<number> | null = null,
		top_k: number = 5
	) {
		let calc_data: Array<Pair> = [];

		if (!weight1 || !weight2) {
			for (let i = 0; i < keys.length; i++) {
				calc_data.push({ name: keys[i], value: Math.abs(pred1[i] - pred2[i]) });
			}
		} else {
			for (let i = 0; i < pred1.length; i++) {
				calc_data.push({
					name: keys[i],
					value: Math.abs(pred1[i] - pred2[i]) * (Math.abs(weight1[i]) + Math.abs(weight2[i])),
				});
			}
		}
		let top_k_value: number = Math.min(calc_data.length, top_k);
		const sort_data = calc_data.sort((a, b) => b.value - a.value).slice(0, top_k_value);
		const new_keys = sort_data.map((item) => item.name);
		return new_keys;
	}
	function matchArr(
		pred1: Array<Pair>,
		pred2: Array<Pair>,
		weight1: Array<Pair> | null = null,
		weight2: Array<Pair> | null = null,
		sigmoided: boolean = false
	) {
		// make a dict key from pred
		console.log("pred1", pred1);
		console.log("pred2", pred2);
		const pred1_dict: Record<string, number> = {};
		pred1.map((item) => (pred1_dict[item.name] = item.value));
		const pred1_list = keys.map((key) => pred1_dict[key]);
		// make a dict key from pred 2
		const pred2_dict: Record<string, number> = {};
		pred2.map((item) => (pred2_dict[item.name] = item.value));

		const pred2_list = keys.map((key) => pred2_dict[key]);
		const keySet = new Set([...Object.keys(pred1_dict), ...Object.keys(pred2_dict)]);
		const keys = Array.from(keySet);
		let new_keys: Array<string> = [];
		if (weight1 && weight2) {
			// make a dict key from weight 1
			const weight1_dict: Record<string, number> = {};
			weight1.map((item) => (weight1_dict[item.name] = item.value));
			const weight1_list = keys.map((key) => weight1_dict[key]);
			// make a dict key from pred 2
			const weight2_dict: Record<string, number> = {};
			weight2.map((item) => (weight2_dict[item.name] = item.value));
			const weight2_list = keys.map((key) => weight2_dict[key]);
			new_keys = selectedData(keys, pred1_list, pred2_list, weight1_list, weight2_list);
		} else {
			new_keys = selectedData(keys, pred1_list, pred2_list);
		}
		return {
			x1: new_keys.map((key) => (sigmoided ? sigmoid(pred1_dict[key]) : pred1_dict[key])),
			x2: new_keys.map((key) => (sigmoided ? sigmoid(pred2_dict[key]) : pred2_dict[key])),
			labels: new_keys,
		};
	}
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

	$: {
		console.log("selectedMaskIndexes1", selectedMaskIndexes1);
		console.log("selectedMaskIndexes2", selectedMaskIndexes2);
		if (selectedMaskIndexes1.length > 0 && selectedMaskIndexes2.length > 0) {
			console.log(
				matchArr(
					render_data1["trained_attr_region_scores"][0],
					render_data2["trained_attr_region_scores"][0]
				)
			);
		}
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
					console.log("render_data1", render_data1);
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
					src={base + "/images/" + json_data.image_1}
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
					src={base + "/images/" + json_data.image_2}
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
	<button
		class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
		on:click={() => {
			weighted = !weighted;
		}}
	>
		{weighted ? "Show Unweighted Difference" : "Show Weighted Difference"}
	</button>

	<div class="flex flex-col">
		<div class="flex w-full items-center justify-center">
			{#if render_data1["trained_attr_img_scores"] && render_data2["trained_attr_img_scores"]}
				{#if weighted}
					<HorizontalBarChartsCompare
						{...matchArr(
							render_data1["trained_attr_img_scores"],
							render_data2["trained_attr_img_scores"],
							render_data1["predictor_weights"],
							render_data2["predictor_weights"],
							true
						)}
						width="500px"
						name="Top Detected Attribute Difference"
					/>
				{:else}
					<HorizontalBarChartsCompare
						{...matchArr(
							render_data1["trained_attr_img_scores"],
							render_data2["trained_attr_img_scores"],
							null,
							null,
							true
						)}
						width="500px"
						name="Top Detected Attribute Difference"
					/>
				{/if}
			{:else if json_data.probs1}
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

	<div class="height-[500px] relative items-center">
		{#if selectedMaskIndexes1.length > 0 && selectedMaskIndexes2.length > 0}
			<div class="w-full text-center">
				<h1>Selected Regions</h1>
			</div>
			{#each selectedMaskIndexes1 as index1}
				{#each selectedMaskIndexes2 as index2}
					<div
						class="
			border-5
			align-center
			relative
			grid
			w-full
			grid-cols-2
			items-center
			justify-center overflow-hidden border-gray-300 shadow-lg"
					>
						<img
							src={maskingImage(imgElement1, maskURLs1[index1])}
							class="w-[200px] border-4 border-solid"
							style="border-color: #69b3a2"
						/>
						<img
							src={maskingImage(imgElement2, maskURLs2[index2])}
							class="w-[200px] border-4 border-solid"
							style="border-color: #ff0000"
						/>
					</div>

					<div class="flex w-full items-center justify-center">
						<div
							class="
			relative
			grid
			w-[700px]
			grid-cols-2
			items-center
			justify-center
			"
						>
							{#if weighted}
								<HorizontalBarChartsCompare
									{...matchArr(
										render_data1["trained_attr_region_scores"][index1],
										render_data2["trained_attr_region_scores"][index2],
										render_data1["predictor_weights"],
										render_data2["predictor_weights"],
										false
									)}
									width="500px"
									name="Top Detected Attribute Difference"
								/>
							{:else}
								<HorizontalBarChartsCompare
									{...matchArr(
										render_data1["trained_attr_region_scores"][index1],
										render_data2["trained_attr_region_scores"][index2],
										null,
										null,
										false
									)}
									width="500px"
									name="Top Detected Attribute Difference"
								/>
							{/if}
						</div>
					</div>
				{/each}
			{/each}
		{/if}
	</div>
</div>
