<script lang="ts">
	import type { Message } from "$lib/types/Message";
	import { createEventDispatcher, onDestroy } from "svelte";
	import { base } from "$app/paths";

	import CarbonSendAltFilled from "~icons/carbon/send-alt-filled";
	import CarbonExport from "~icons/carbon/export";
	import CarbonStopFilledAlt from "~icons/carbon/stop-filled-alt";
	import CarbonClose from "~icons/carbon/close";
	import CarbonCheckmark from "~icons/carbon/checkmark";

	import EosIconsLoading from "~icons/eos-icons/loading";

	import ChatMessages from "./ChatMessages.svelte";
	import ChatInput from "./ChatInput.svelte";
	import StopGeneratingBtn from "../StopGeneratingBtn.svelte";
	import ImageGallery from "./ImageGallery.svelte";
	import type { Model } from "$lib/types/Model";
	import WebSearchToggle from "../WebSearchToggle.svelte";
	import LoginModal from "../LoginModal.svelte";
	import type { WebSearchUpdate } from "$lib/types/MessageUpdate";
	import { page } from "$app/stores";
	import DisclaimerModal from "../DisclaimerModal.svelte";
	import FileDropzone from "./FileDropzone.svelte";
	import RetryBtn from "../RetryBtn.svelte";
	import ImagePreview from "../ImagePreview.svelte";

	type ImageJSON = {
		id: string;
		url: string;
	};
	import UploadBtn from "../UploadBtn.svelte";
	import file2base64 from "$lib/utils/file2base64";
	import { useSettingsStore } from "$lib/stores/settings";

	export let messages: Message[] = [];
	export let loading = false;
	export let pending = false;
	export let shared = false;
	export let currentModel: Model;
	export let models: Model[];
	export let webSearchMessages: WebSearchUpdate[] = [];
	export let preprompt: string | undefined = undefined;
	export let files: File[] = [];
	export let currentSelectedImages: ImageJSON[] = [];

	$: isReadOnly = !models.some((model) => model.id === currentModel.id);
	let loginModalOpen = false;
	let message: string;
	let timeout: ReturnType<typeof setTimeout>;
	let isSharedRecently = false;
	$: $page.params.id && (isSharedRecently = false);
	let imageGaleryOpened = false;
	let images: ImageJSON[] = [];
	let fileInput: HTMLInputElement;

	const dispatch = createEventDispatcher<{
		message: string;
		share: void;
		stop: void;
		retry: { id: Message["id"]; content: string };
		imageUpload: ImageJSON;
		imageClick: ImageJSON;
	}>();

	const handleSubmit = () => {
		if (loading) return;
		let text = "";

		currentSelectedImages.forEach((image) => {
			text += `<image>{
				"url": "${base + "/images/" + image.id}",
				"id": "${image.id}"
			}</image>\n`;
		});
		message = text + "\n" + message;
		dispatch("message", message);
		console.log("message", message);
		currentSelectedImages = [];
		message = "";
	};

	async function handleFileChange(event: Event) {
		const new_files = (event.target as HTMLInputElement).files as FileList;
		if (!files) return;
		for (let i = 0; i < new_files.length; i++) {
			const nf = new_files[0];
			if (nf) {
				// Convert the ImageJSON file to a URL that can be displayed
				// const imageUrl = URL.createObjectURL(file);

				// Prepare the file to be sent in a FormData object
				const formData = new FormData();
				formData.append("file", nf);
				// POST the ImageJSON file to the server
				const response = await fetch(`${base}/upload_image`, {
					method: "POST",
					headers: {
						accept: "multipart/form-data",
					},
					body: formData,
				});

				// Handle the response
				if (response.ok) {
					// Use the returned URL
					const result = await response.json();
					console.log("result", result);
					const json = { id: result.id, url: result.url };
					dispatch("imageUpload", json);
					currentSelectedImages = [...currentSelectedImages, json];
					console.log("json", json);
					if (loading) return;
				} else {
					console.error("Upload failed", response);
				}
			}
		}
	}
	function handleUploadClick(): void {
		fileInput.click();
	}
	function handleImageGaleryClick(): void {
		console.log("clicked");
		imageGaleryOpened = !imageGaleryOpened;
	}
	function onSelectImage(image: ImageJSON) {
		dispatch("imageClick", image);
		currentSelectedImages = [...currentSelectedImages, image];
		console.log("dispatched message over here");
	}
	let lastTarget: EventTarget | null = null;

	let onDrag = false;

	const onDragEnter = (e: DragEvent) => {
		lastTarget = e.target;
		onDrag = true;
	};
	const onDragLeave = (e: DragEvent) => {
		if (e.target === lastTarget) {
			onDrag = false;
		}
	};
	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
	};
	$: lastIsError = messages[messages.length - 1]?.from === "user" && !loading;

	$: sources = files.map((file) => file2base64(file));

	const settings = useSettingsStore();

	function onShare() {
		dispatch("share");
		isSharedRecently = true;
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			isSharedRecently = false;
		}, 2000);
	}

	onDestroy(() => {
		if (timeout) {
			clearTimeout(timeout);
		}
	});
</script>

<div class="relative min-h-0 min-w-0">
	{#if !$settings.ethicsModalAccepted}
		<DisclaimerModal />
	{:else if loginModalOpen}
		<LoginModal
			on:close={() => {
				loginModalOpen = false;
			}}
		/>
	{/if}
	<ChatMessages
		{loading}
		{pending}
		{currentModel}
		{models}
		{messages}
		readOnly={isReadOnly}
		isAuthor={!shared}
		{webSearchMessages}
		{preprompt}
		on:message={(ev) => {
			if ($page.data.loginRequired) {
				loginModalOpen = true;
			} else {
				dispatch("message", ev.detail);
			}
		}}
		on:vote
		on:retry={(ev) => {
			if (!loading) dispatch("retry", ev.detail);
		}}
	/>

	<div
		class="dark:via-gray-80 pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto flex w-full max-w-3xl flex-col items-center justify-center bg-gradient-to-t from-white via-white/80 to-white/0 px-3.5 py-4 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900/0 max-md:border-t max-md:bg-white max-md:dark:bg-gray-900 sm:px-5 md:py-8 xl:max-w-4xl [&>*]:pointer-events-auto"
	>
		{#if sources.length}
			<div class="flex flex-row flex-wrap justify-center gap-2.5 max-md:pb-3">
				{#each sources as source, index}
					{#await source then src}
						<div class="relative h-16 w-16 overflow-hidden rounded-lg shadow-lg">
							<img
								src={`data:image/*;base64,${src}`}
								alt="input content"
								class="h-full w-full rounded-lg bg-gray-400 object-cover dark:bg-gray-900"
							/>
							<!-- add a button on top that deletes this image from sources -->
							<button
								class="absolute left-1 top-1"
								on:click={() => {
									files = files.filter((_, i) => i !== index);
								}}
							>
								<CarbonClose class="text-md font-black text-gray-300  hover:text-gray-100" />
							</button>
						</div>
					{/await}
				{/each}
			</div>
		{/if}

		<div class="w-full">
			<div class="flex w-full pb-3">
				{#if $page.data.settings?.searchEnabled}
					<WebSearchToggle />
				{/if}
				{#if loading}
					<StopGeneratingBtn classNames="ml-auto" on:click={() => dispatch("stop")} />
				{:else if lastIsError}
					<RetryBtn
						classNames="ml-auto"
						on:click={() =>
							dispatch("retry", {
								id: messages[messages.length - 1].id,
								content: messages[messages.length - 1].content,
							})}
					/>
				{:else if currentModel.multimodal}
					<UploadBtn bind:files classNames="ml-auto" />
				{/if}
			</div>

			<!-- Image UI -->
			{#if imageGaleryOpened}
				<div class="flex-2 flex w-full items-center border-white">
					<ImageGallery {images} {onSelectImage} />
				</div>
			{/if}
			<div class="flex-2 flex items-center">
				<label for="imageUpload" class="custom-file-upload">
					<input
						type="file"
						bind:this={fileInput}
						id="imageUpload"
						accept="image/*"
						on:change={handleFileChange}
						hidden
					/>
				</label>

				<button
					class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
					on:click={handleUploadClick}
				>
					Upload Images
				</button>
				<button
					class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
					on:click={handleImageGaleryClick}
				>
					{imageGaleryOpened ? "Close" : "Open"} Image Gallery
				</button>
			</div>
			<!-- End Image UI -->
			<div class="w-full rounded-xl bg-black bg-opacity-20">
				{#if currentSelectedImages}
					<div class="op flex w-full flex-row items-center justify-start p-4">
						{#each currentSelectedImages as image}
							<ImagePreview
								json={image}
								on:deleteImage={() => {
									currentSelectedImages = currentSelectedImages.filter((i) => i.id !== image.id);
								}}
							/>
						{/each}
					</div>
				{/if}
				<form
					on:dragover={onDragOver}
					on:dragenter={onDragEnter}
					on:dragleave={onDragLeave}
					tabindex="-1"
					aria-label="file dropzone"
					on:submit|preventDefault={handleSubmit}
					class="relative flex w-full max-w-4xl flex-1 items-center rounded-xl border bg-gray-100 focus-within:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:focus-within:border-gray-500
			{isReadOnly ? 'opacity-30' : ''}"
				>
					{#if onDrag && currentModel.multimodal}
						<FileDropzone bind:files bind:onDrag />
					{:else}
						<div class="flex w-full flex-1 border-none bg-transparent">
							{#if lastIsError}
								<ChatInput value="Sorry, something went wrong. Please try again." disabled={true} />
							{:else}
								<ChatInput
									placeholder="Ask anything"
									bind:value={message}
									on:submit={handleSubmit}
									on:keypress={(ev) => {
										if ($page.data.loginRequired) {
											ev.preventDefault();
											loginModalOpen = true;
										}
									}}
									maxRows={6}
									disabled={isReadOnly || lastIsError}
								/>
							{/if}

							{#if loading}
								<button
									class="btn mx-1 my-1 inline-block h-[2.4rem] self-end rounded-lg bg-transparent p-1 px-[0.7rem] text-gray-400 disabled:opacity-60 enabled:hover:text-gray-700 dark:disabled:opacity-40 enabled:dark:hover:text-gray-100 md:hidden"
									on:click={() => dispatch("stop")}
								>
									<CarbonStopFilledAlt />
								</button>
								<div
									class="mx-1 my-1 hidden h-[2.4rem] items-center p-1 px-[0.7rem] text-gray-400 disabled:opacity-60 enabled:hover:text-gray-700 dark:disabled:opacity-40 enabled:dark:hover:text-gray-100 md:flex"
								>
									<EosIconsLoading />
								</div>
							{:else}
								<button
									class="btn mx-1 my-1 h-[2.4rem] self-end rounded-lg bg-transparent p-1 px-[0.7rem] text-gray-400 disabled:opacity-60 enabled:hover:text-gray-700 dark:disabled:opacity-40 enabled:dark:hover:text-gray-100"
									disabled={!message || isReadOnly}
									type="submit"
								>
									<CarbonSendAltFilled />
								</button>
							{/if}
						</div>
					{/if}
				</form>
			</div>
			<div
				class="mt-2 flex justify-between self-stretch px-1 text-xs text-gray-400/90 max-md:mb-2 max-sm:gap-2"
			>
				<p>
					Model: <a
						href={currentModel.modelUrl || "https://huggingface.co/" + currentModel.name}
						target="_blank"
						rel="noreferrer"
						class="hover:underline">{currentModel.displayName}</a
					> <span class="max-sm:hidden">·</span><br class="sm:hidden" /> Generated content may be inaccurate
					or false.
				</p>
				{#if messages.length}
					<button
						class="flex flex-none items-center hover:text-gray-400 max-sm:rounded-lg max-sm:bg-gray-50 max-sm:px-2.5 dark:max-sm:bg-gray-800"
						type="button"
						class:hover:underline={!isSharedRecently}
						on:click={onShare}
						disabled={isSharedRecently}
					>
						{#if isSharedRecently}
							<CarbonCheckmark class="text-[.6rem] sm:mr-1.5 sm:text-green-600" />
							<div class="text-green-600 max-sm:hidden">Link copied to clipboard</div>
						{:else}
							<CarbonExport class="text-[.6rem] sm:mr-1.5 sm:text-primary-500" />
							<div class="max-sm:hidden">Share this conversation</div>
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
