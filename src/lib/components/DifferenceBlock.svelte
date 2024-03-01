<script lang="ts">
	import { data } from "autoprefixer";
	import HorizontalBarCharts from "./d3figure/HorizontalBarCharts.svelte";
	import HorizontalBarChartsCompare from "./d3figure/HorizontalBarChartsCompare.svelte";

	export let json_data = {};
	let color_1 = "#69b3a2";
	let color_2 = "#ff0000";
</script>

<div class="flex flex-col">
	<div class="grid grid-cols-2 divide-x">
		{#if json_data.image_1}
			<div class="flex w-full items-center justify-center">
				<img
					src={"/images/" + json_data.image_1}
					class={`h-fit w-fit border-4 border-solid`}
					style="border-color: #69b3a2"
				/>
			</div>
		{/if}
		{#if json_data.image_2}
			<div class="flex w-full items-center justify-center">
				<img
					src={"/images/" + json_data.image_2}
					class={`h-fit w-fit border-4 border-solid`}
					style="border-color: #ff0000"
				/>
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
