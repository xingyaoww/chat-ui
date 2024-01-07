<script lang="ts">
	import { afterUpdate } from "svelte";
	import CopyToClipBoardBtn from "./CopyToClipBoardBtn.svelte";

	export let code = "";
	export let lang = "";

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
</script>

<div class="group relative my-4 rounded-lg">
	<!-- eslint-disable svelte/no-at-html-tags -->
	{#if lang === "result"}
		<div class="rounded-lg bg-gray-800 p-4 text-xs">
			<div class="mb-1 text-gray-400">STDOUT/STDERR</div>
			<pre
			bind:this={scrollToBottomElement}
			class="scrollbar-custom scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 overflow-auto px-5 max-h-[60vh] bg-gray-800"
			style="padding-left: 0; padding-right: 0; padding-bottom: 0; padding-top: 0; margin-bottom: 0; font-size: 0.75rem;"
			><code
				class="language-console">{@html highlightedCode || code.replaceAll("<", "&lt;")}</code
			></pre>
		</div>
	{:else if lang === "execute"}
		<div class="rounded-lg bg-gray-800 p-4 text-xs">
			<div class="mb-1 text-gray-400">EXECUTE</div>
			<pre
			class="scrollbar-custom scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 overflow-auto px-5 bg-gray-800"
			style="padding-left: 0; padding-right: 0; padding-bottom: 0; padding-top: 0; margin-bottom: 0; font-size: 0.75rem;"
			><code
				class="language-{lang}">{@html highlightedCode || code.replaceAll("<", "&lt;")}</code
			></pre>
		</div>

		<CopyToClipBoardBtn
			classNames="absolute top-2 right-2 invisible opacity-0 group-hover:visible group-hover:opacity-100"
			value={code}
		/>
	{:else}
		<div class="rounded-lg bg-gray-800 p-4 text-xs">
			<div class="mb-1 text-gray-400">CODE</div>
			<pre
			class="scrollbar-custom scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 overflow-auto px-5 bg-gray-800"
			style="padding-left: 0; padding-right: 0; padding-bottom: 0; padding-top: 0; margin-bottom: 0; font-size: 0.75rem;"
			><code
				class="language-{lang}">{@html highlightedCode || code.replaceAll("<", "&lt;")}</code
			></pre>
		</div>

		<CopyToClipBoardBtn
			classNames="absolute top-2 right-2 invisible opacity-0 group-hover:visible group-hover:opacity-100"
			value={code}
		/>

	{/if}
</div>
