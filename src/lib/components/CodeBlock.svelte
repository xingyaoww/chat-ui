<script lang="ts">
	import { afterUpdate } from "svelte";
	import CopyToClipBoardBtn from "./CopyToClipBoardBtn.svelte";
	import HorizontalBarCharts from "./d3figure/HorizontalBarCharts.svelte";
	import JSON5 from "json5";
	import PieChart from "./d3figure/PieChart.svelte";
	import ImageAnnotation from "./ImageAnnotation.svelte";

	export let code = "";
	export let lang = "";
	let showReasons = false;
	let chartType = "horizontalBar";

	$: highlightedCode = "";

	afterUpdate(async () => {
		const { default: hljs } = await import("highlight.js");
		const language = hljs.getLanguage(lang);

		highlightedCode = hljs.highlightAuto(code, language?.aliases).value;
	});

	function isValidJson(jsonString: string) {
		try {
			return JSON5.parse(jsonString);
		} catch (e) {
			return false;
		}
	}

	// Reactive statement to check and parse JSON
	$: parsedJson = code && isValidJson(code);

	// Another reactive statement to determine the content type
	$: contentType = parsedJson ? parsedJson.type : null;
	$: console.log("code", code);
</script>

<div class="group relative my-4 rounded-lg">
	<!-- eslint-disable svelte/no-at-html-tags -->
	{#if lang === "result"}
		{#if contentType === "ecole-message"}
			<p>{parsedJson.data}</p>
		{:else if contentType === "ecole-image"}
			<img src={parsedJson.data} />
		{:else if contentType === "ecole-grounding-data"}
			<div>
				<p>{parsedJson.data}</p>
				<ImageAnnotation data={parsedJson} />
			</div>
		{:else if contentType === "ecole-json"}
			{#if parsedJson.data}
				<p>{parsedJson.data}</p>
			{/if}
			{#if parsedJson.reasons}
				<button
					class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
					on:click={() => {
						showReasons = !showReasons;
					}}
				>
					{showReasons ? "Hide Reasons" : "Show Reasons"}
				</button>

				{#if showReasons}
					<p>{parsedJson.reasons.text}</p>
					<button
						class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
						on:click={() => {
							chartType = chartType === "horizontalBar" ? "pie" : "horizontalBar";
						}}
					>
						{chartType === "horizontalBar" ? "Show Pie Chart" : "Show Horizontal Bar Chart"}
					</button>
					{#if chartType === "pie"}
						<PieChart
							data={parsedJson.reasons.descriptions.map((desc, index) => ({
								name: desc,
								value: parseFloat(parsedJson.reasons.scores[index]),
							}))}
						/>
					{:else}
						<HorizontalBarCharts
							data={parsedJson.reasons.descriptions.map((desc, index) => ({
								name: desc,
								value: parseFloat(parsedJson.reasons.scores[index]),
							}))}
						/>
					{/if}
				{/if}
			{/if}
		{:else if contentType === "ecole-json-reason"}
			{#if parsedJson.reasons}
				<p>{parsedJson.reasons.text}</p>
				<button
					class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
					on:click={() => {
						chartType = chartType === "horizontalBar" ? "pie" : "horizontalBar";
					}}
				>
					{chartType === "horizontalBar" ? "Show Pie Chart" : "Show Horizontal Bar Chart"}
				</button>
				{#if chartType === "pie"}
					<PieChart
						data={parsedJson.reasons.descriptions.map((desc, index) => ({
							name: desc,
							value: parseFloat(parsedJson.reasons.scores[index]),
						}))}
					/>
				{:else}
					<HorizontalBarCharts
						data={parsedJson.reasons.descriptions.map((desc, index) => ({
							name: desc,
							value: parseFloat(parsedJson.reasons.scores[index]),
						}))}
					/>
				{/if}
			{/if}
		{:else}
			<div class="rounded-lg bg-gray-700 p-4 text-xs">
				<div class="mb-1 text-gray-400">STDOUT/STDERR</div>
				<div class="prose flex flex-col-reverse text-white">
					{@html code.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br />")}
				</div>
			</div>
		{/if}
	{:else}
		<pre
			class="scrollbar-custom overflow-auto px-5 scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20"><code
				class="language-{lang}">{@html highlightedCode || code.replaceAll("<", "&lt;")}</code
			></pre>
		<CopyToClipBoardBtn
			classNames="absolute top-2 right-2 invisible opacity-0 group-hover:visible group-hover:opacity-100"
			value={code}
		/>
	{/if}
</div>
