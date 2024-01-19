<script lang="ts">
	import { page } from "$app/stores";
	import { base } from "$app/paths";
	import { PUBLIC_ORIGIN } from "$env/static/public";
	import type { BackendModel } from "$lib/server/models";
	import { useSettingsStore } from "$lib/stores/settings";
	import CopyToClipBoardBtn from "$lib/components/CopyToClipBoardBtn.svelte";
	import CarbonArrowUpRight from "~icons/carbon/arrow-up-right";
	import CarbonLink from "~icons/carbon/link";
	import defaultCurriculum from "./curriculum2.json";

	const settings = useSettingsStore();
	let mode: string = "System Prompt";
	let curriculum: any = defaultCurriculum;

	const translateCurriculumToPreprompt = (curriculum: any) => {
		const userMessageToken = curriculum["userMessageToken"];
		const assistantMessageToken = curriculum["assistantMessageToken"];
		const prepromptMessageToken = curriculum["prepromptMessageToken"];
		const userMessageEndToken = curriculum["userMessageEndToken"];
		const assistantMessageEndToken = curriculum["assistantMessageEndToken"];
		const prepromptMessageEndToken = curriculum["prepromptMessageEndToken"];
		const system_description = curriculum["system_description"];
		const tools = curriculum["tools"];
		console.log("tools", tools);
		const toolList = tools
			.map(
				(tool, index) => `[${index}] ${tool["name"]}
Description: ${tool["description"]}. 
Example Questions: 
${tool["example_question"].map((question) => "- '" + question + "'").join("\n- ")}
Parameters: ${tool["variables"]
					.map((param) => param["name"] + ": " + param["description"])
					.join("; ")}
Example: ${tool["example_code"]}`
			)
			.join("\n\n");

		const exampleConversations = tools
			.map((tool) => tool["example_conversation_prompt"])
			.flat()
			.flat()
			.map((message) => {
				if (message["role"] === "user") {
					return `${userMessageToken}
${message["message"]}
${userMessageEndToken}`;
				} else if (message["role"] === "code") {
					return `${assistantMessageToken}
<execute>${message["message"]}</execute>
${assistantMessageEndToken}`;
				} else if (message["role"] === "output") {
					return `${userMessageToken}
Execution Output:
${message["message"]}
${userMessageEndToken}`;
				} else {
					return `${assistantMessageToken}
${message["message"]}
${assistantMessageEndToken}`;
				}
			})
			.join("\n");
		const newPreprompt = `${prepromptMessageToken}
${system_description}
 
You have access to the following tools (pre-imported Python functions):
 
${toolList}
${prepromptMessageEndToken}
${exampleConversations}
${userMessageToken}
Remember you have access to these tools:
 
${tools.map((tool, index) => "[" + index + "]" + tool["name"]).join("\n")}
`;
		return newPreprompt;
	};

	$: if ($settings.customPrompts[$page.params.model] === undefined) {
		$settings.customPrompts = {
			...$settings.customPrompts,
			[$page.params.model]:
				$page.data.models.find((el: BackendModel) => el.id === $page.params.model)?.preprompt || "",
		};
	}

	$: hasCustomPreprompt =
		$settings.customPrompts[$page.params.model] !==
		$page.data.models.find((el: BackendModel) => el.id === $page.params.model)?.preprompt;

	$: isActive = $settings.activeModel === $page.params.model;

	$: model = $page.data.models.find((el: BackendModel) => el.id === $page.params.model);
	$: if (mode === "System Curriculum") {
		if ($page.data.models.find((el: BackendModel) => el.id === $page.params.model)?.curriculum) {
			curriculum = $page.data.models.find(
				(el: BackendModel) => el.id === $page.params.model
			)?.curriculum;
		} else {
			curriculum = defaultCurriculum;
		}
	}
	$: if (curriculum && mode === "System Curriculum") {
		$settings.customPrompts[$page.params.model] = translateCurriculumToPreprompt(curriculum);
	}
	$: console.log("curriculum", curriculum);
</script>

<div class="flex flex-col items-start">
	<div class="mb-5 flex flex-col gap-1.5">
		<h2 class="text-lg font-semibold md:text-xl">
			{$page.params.model}
		</h2>

		{#if model.description}
			<p class=" text-gray-600">
				{model.description}
			</p>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2 md:gap-4">
		<a
			href={model.modelUrl || "https://huggingface.co/" + model.name}
			target="_blank"
			rel="noreferrer"
			class="flex items-center truncate underline underline-offset-2"
		>
			<CarbonArrowUpRight class="mr-1.5 shrink-0 text-xs " />
			Model page
		</a>

		{#if model.datasetName || model.datasetUrl}
			<a
				href={model.datasetUrl || "https://huggingface.co/datasets/" + model.datasetName}
				target="_blank"
				rel="noreferrer"
				class="flex items-center truncate underline underline-offset-2"
			>
				<CarbonArrowUpRight class="mr-1.5 shrink-0 text-xs " />
				Dataset page
			</a>
		{/if}

		{#if model.websiteUrl}
			<a
				href={model.websiteUrl}
				target="_blank"
				class="flex items-center truncate underline underline-offset-2"
				rel="noreferrer"
			>
				<CarbonArrowUpRight class="mr-1.5 shrink-0 text-xs " />
				Model website
			</a>
		{/if}
		<CopyToClipBoardBtn
			value="{PUBLIC_ORIGIN || $page.url.origin}{base}?model={model.id}"
			classNames="!border-none !shadow-none !py-0 !px-1 !rounded-md"
		>
			<div class="flex items-center gap-1.5">
				<CarbonLink />Copy direct link to model
			</div>
		</CopyToClipBoardBtn>
	</div>

	<button
		class="{isActive
			? 'bg-gray-100'
			: 'bg-black text-white'} my-8 flex items-center rounded-full px-3 py-1"
		disabled={isActive}
		name="Activate model"
		on:click|stopPropagation={() => {
			$settings.activeModel = $page.params.model;
		}}
	>
		{isActive ? "Active model" : "Activate"}
	</button>

	<div class="flex w-full flex-col gap-2">
		<div class="flex w-full flex-row content-between">
			<h3
				class={`mb-1.5 text-lg font-semibold text-gray-${mode === "System Prompt" ? "800" : "300"}`}
				on:click={() => {
					mode = "System Prompt";
				}}
			>
				System Prompt
			</h3>
			<div class="border-black-600 m-3 w-1 border-l-2" />
			<h3
				class={`mb-1.5 text-lg font-semibold text-gray-${
					mode === "System Curriculum" ? "800" : "300"
				}`}
				on:click={() => {
					mode = "System Curriculum";
				}}
			>
				System Curriculum
			</h3>
			{#if hasCustomPreprompt}
				<button
					class="ml-auto underline decoration-gray-300 hover:decoration-gray-700"
					on:click|stopPropagation={() =>
						($settings.customPrompts[$page.params.model] = model.preprompt)}
				>
					Reset
				</button>
			{/if}
		</div>
		<textarea
			rows="10"
			class="w-full resize-none rounded-md border-2 bg-gray-100 p-2"
			bind:value={$settings.customPrompts[$page.params.model]}
		/>
		<!-- {#if mode === "System Prompt"}
			
		{:else if mode === "System Curriculum"}
			<textarea
				rows="10"
				class="w-full resize-none rounded-md border-2 bg-gray-100 p-2"
				bind:value={$settings.customPrompts[$page.params.model]}
			/>
		{/if} -->
	</div>
</div>
