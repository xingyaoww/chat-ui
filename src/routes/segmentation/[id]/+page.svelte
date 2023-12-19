<script lang="js">
	// @ts-nocheck
	import CarbonClose from "~icons/carbon/close";
	import { onMount } from "svelte";
	import { InferenceSession, env } from "onnxruntime-web";
	import Stage from "$lib/components/SAM_Segmentation/Stage.svelte";
	import { v4 as uuid } from "uuid";
	import {
		arrayToImageData,
		imageDataToImage,
		compressor,
		decompressor,
	} from "$lib/components/SAM_Segmentation/maskUtils";
	import { handleImageScale } from "$lib/components/SAM_Segmentation/scaleHelper";
	import { modelData } from "$lib/components/SAM_Segmentation/onnxModelAPI";
	import Modal from "$lib/components/Modal.svelte";
	import { error } from "@sveltejs/kit";

	export let MODEL_DIR = new URL(
		"$lib/components/SAM_Segmentation/model/sam_onnx_quantized.onnx",
		import.meta.url
	).href;
	/** @type {import('./$types').PageData} */
	export let data;

	console.log("data", data);

	let model;
	let tensor;
	let modelScale;
	let image;
	let fileInput;
	let maskImg;
	let savedMaskImgs = [];
	let clicks = []; // Replace with your actual logic for handling clicks
	let savedClicks = [];
	let savedOutput;
	let isLoading = true; // New variable to track loading state

	onMount(async () => {
		if (MODEL_DIR) {
			env.wasm.wasmPaths =
				window.location.protocol === "file:"
					? window.location.href.substring(0, window.location.href.indexOf("app.asar"))
					: "";
			try {
				env.wasm.wasmPaths = "/onnxruntime-web/";
				model = await InferenceSession.create(MODEL_DIR, { executionProviders: ["wasm"] });
				console.log("model instantiated", model);
			} catch (e) {
				console.error("cannot instantiate", e);
			}
		}

		const img = new Image();
		img.src = data.props.image;
		img.onload = () => {
			modelScale = handleImageScale(img);
			image = img;
		};
		tensor = data.props.tensor;
		try {
			const fetch_annotations = await fetch(
				`/api/annotations/${data.props.image.split("/").pop().split(".")[0]}`
			);
		} catch (e) {
			console.error("cannot instantiate", e);
		}
		isLoading = false; // Set loading state to false when the image is loaded
	});

	async function runONNX() {
		if (!model || !clicks || !tensor || !modelScale || clicks == []) return;

		const feeds = modelData({ clicks, tensor, modelScale });
		if (!feeds) return;

		const results = await model.run(feeds);
		const output = results[model.outputNames[0]];
		savedOutput = arrayToImageData(output.data, output.dims[2], output.dims[3]);
		maskImg = imageDataToImage(savedOutput);
	}

	// Reactive statement to run the ONNX model when 'clicks' changes
	$: if (clicks) {
		if (clicks.length === 0) {
			maskImg = null;
		} else {
			runONNX();
		}
	}

	$: if (savedMaskImgs) {
		console.log("savedMaskImgs", savedMaskImgs);
	}
	// Function to handle mouse click event
	const handleMouseHover = (event) => {
		event.preventDefault();
		clicks = [...savedClicks.map((detail) => detail.click), event.detail.click];
	};
	const handleMouseClick = (event) => {
		event.preventDefault();
		savedClicks = [...savedClicks, event.detail];
	};
	const handleMouseOut = () => {
		clicks = [...savedClicks.map((detail) => detail.click)];
	};
	const handleUndo = () => {
		savedClicks = savedClicks.slice(0, -1);
		clicks = [...savedClicks.map((detail) => detail.click)];
	};
	const handleSave = (event) => {
		console.log("handleSave", event.detail);

		if (event.detail.id && event.detail.id !== "") {
			console.log("go here", event.detail.id);
			savedMaskImgs = [
				...savedMaskImgs.filter((img) => img.id !== event.detail.id),
				{
					id: event.detail.id,
					output: savedOutput,
					clicks: savedClicks,
					name: event.detail.name,
					description: event.detail.description,
				},
			];
			return;
		}

		savedMaskImgs = [
			...savedMaskImgs,
			{
				id: uuid(),
				output: savedOutput,
				clicks: savedClicks,
				name: event.detail.name,
				description: event.detail.description,
			},
		];
		savedClicks = [];
		clicks = [];
	};
	const handleSelect = (event) => {
		console.log("handleSelect", event.detail);
		if (event.detail && savedMaskImgs && savedMaskImgs.length > 0) {
			const savedMaskImg = savedMaskImgs.find((savedMaskImg) => savedMaskImg.id === event.detail);
			if (savedMaskImg) {
				savedOutput = savedMaskImg.output;
				savedClicks = savedMaskImg.clicks;
				maskImg = imageDataToImage(savedOutput);
			}
		} else {
			savedOutput = null;
			savedClicks = [];
			maskImg = null;
		}
	};
	const handleDelete = (event) => {
		savedMaskImgs = savedMaskImgs.filter((img) => img.id !== event.detail);
		savedOutput = null;
		savedClicks = [];
		maskImg = null;
	};

	const handleDownload = () => {
		const saveContent = savedMaskImgs.map((img) => {
			return {
				...img,
				output: {
					height: img.output.height,
					width: img.output.width,
					data: compressor(img.output.data),
				},
			};
		});
		const jsonContent = JSON.stringify(saveContent);
		const blob = new Blob([jsonContent], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "data.json";
		a.click();

		URL.revokeObjectURL(url);
	};

	const handleUpload = () => {
		fileInput.click(); // triggers the hidden file input
	};

	const processFile = () => {
		const file = fileInput.files[0];

		if (file) {
			const reader = new FileReader();

			reader.onload = (event) => {
				const jsonContent = event.target.result;
				try {
					const data = JSON.parse(jsonContent);
					// Process your data here
					savedMaskImgs = data.map((img) => {
						return {
							...img,
							output: new ImageData(
								decompressor(img.output.data),
								img.output.width,
								img.output.height
							),
						};
					});
					if (savedMaskImgs && savedMaskImgs.length > 0) {
						maskImg = imageDataToImage(savedMaskImgs[0].output);
						clicks = savedMaskImgs[0].clicks;
						savedOutput = savedMaskImgs[0].output;
					}
					console.log(data);
				} catch (e) {
					console.error("Error parsing JSON:", e);
				}
			};

			reader.onerror = (error) => {
				console.error("Error reading file:", error);
			};

			reader.readAsText(file);
		}
	};
</script>

<Modal
	width="max-w-4xl"
	on:close={() => {
		window.history.back();
	}}
>
	<div class="flex w-full flex-col gap-5 p-6">
		<div class="flex items-start justify-between text-xl font-semibold text-gray-800">
			<h2>Image Annotation Tool</h2>
			<button type="button" class="group" on:click={() => window.history.back()}>
				<CarbonClose class="text-gray-900 group-hover:text-gray-500" />
			</button>
		</div>
		{#if isLoading}
			<div class="flex h-full items-center justify-center">
				<div class="flex items-center justify-center">
					<div class="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900" />
				</div>
			</div>
		{:else}
			<input type="file" id="fileInput" bind:this={fileInput} on:change={processFile} hidden />

			<Stage
				on:mouseHover={handleMouseHover}
				on:mouseClick={handleMouseClick}
				on:mouseOut={handleMouseOut}
				on:undo={handleUndo}
				on:save={handleSave}
				on:select={handleSelect}
				on:delete={handleDelete}
				on:download={handleDownload}
				on:upload={handleUpload}
				{modelScale}
				{image}
				{maskImg}
				{savedClicks}
				{savedMaskImgs}
			/>
		{/if}
	</div>
</Modal>
