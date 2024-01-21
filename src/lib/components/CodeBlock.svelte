<script lang="ts">
	import { afterUpdate } from "svelte";
	import CopyToClipBoardBtn from "./CopyToClipBoardBtn.svelte";
	import HorizontalBarCharts from "./d3figure/HorizontalBarCharts.svelte";
	import JSON5 from "json5";
	import PieChart from "./d3figure/PieChart.svelte";
	import ImageAnnotation from "./ImageAnnotation.svelte";
	import { json } from "@sveltejs/kit";

	export let code = "";
	export let lang = "";
	let showReasons = false;
	let chartType = "horizontalBar";
	let isListJSON = false;

	$: highlightedCode = "";
	let scrollToBottomElement: HTMLPreElement;

	afterUpdate(async () => {
		const { default: hljs } = await import("highlight.js");
		// if lang == execute, get the language `python`
		const language = hljs.getLanguage(lang === "execute" ? "python" : lang);

		highlightedCode = hljs.highlightAuto(code, language?.aliases).value;

		// Scroll to bottom whenever highlightedCode changes
		if (scrollToBottomElement) {
			scrollToBottomElement.scrollTop = scrollToBottomElement.scrollHeight;
		}
	});

	function isValidJson(jsonString: string) {
		try {
			if (jsonString.indexOf("\n{") !== -1) {
				return JSON5.parse("[" + jsonString.replace("\n{", ",{") + "]");
			}
			return JSON5.parse(jsonString);
		} catch (e) {
			return false;
		}
	}
	function checkTypes(listToCheck) {
		const expectedTypes = [
			"ecole-message",
			"ecole-image",
			"ecole-grounding-data",
			"ecole-json",
			"ecole-json-reason",
		];
		return listToCheck.every((item) => expectedTypes.includes(item.type));
	}

	// Reactive statement to check and parse JSON
	$: parsedJson = code && isValidJson(code);
	$: isListJSON = parsedJson && Array.isArray(parsedJson) && checkTypes(parsedJson);

	// Another reactive statement to determine the content type
	$: contentType = parsedJson ? parsedJson.type : null;
</script>

<div class="group relative my-4 rounded-lg">
	<!-- eslint-disable svelte/no-at-html-tags -->
	{#if lang === "result"}
		{#if isListJSON}
			<div class="grid grid-cols-{parsedJson.length} p-2">
				{#each parsedJson as json_el}
					<div class="p-2">
						<svelte:self code={JSON.stringify(json_el, null, 2)} lang="result" />
					</div>
				{/each}
			</div>
		{:else if contentType === "ecole-message"}
			<!-- <p>{parsedJson.data}</p> -->
		{:else if contentType === "ecole-image"}
			<img src={parsedJson.data} />
		{:else if contentType === "ecole-grounding-data"}
			<div>
				<!-- <p>{parsedJson.data}</p> -->
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
	{:else if lang === "execute"}
		<div class="rounded-lg bg-gray-800 p-2 text-xs dark:bg-gray-900">
			<div class="mb-1 text-gray-400">EXECUTE</div>
			<pre
				class="scrollbar-custom overflow-auto px-5 scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20"
				style="padding: 0; margin-bottom: 0; font-size: 0.75rem;"><code class="language-{lang}"
					>{@html highlightedCode || code.replaceAll("<", "&lt;")}</code
				></pre>
		</div>

		<CopyToClipBoardBtn
			classNames="absolute top-2 right-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 text-white "
			value={code}
		/>
	{:else}
		<div class="rounded-lg bg-gray-800 p-2 text-xs dark:bg-gray-900">
			<div class="mb-1 text-gray-400">CODE</div>
			<pre
				class="scrollbar-custom overflow-auto bg-gray-800 px-5 scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20"
				style="padding: 0; margin-bottom: 0; font-size: 0.75rem;"><code class="language-{lang}"
					>{@html highlightedCode || code.replaceAll("<", "&lt;")}</code
				></pre>
		</div>

		<CopyToClipBoardBtn
			classNames="absolute top-2 right-2 invisible opacity-0 group-hover:visible group-hover:opacity-100"
			value={code}
		/>
	{/if}
</div>
