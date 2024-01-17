<script lang="js">
	// @ts-nocheck
	import CarbonClose from "~icons/carbon/close";
	import { onMount } from "svelte";
	import { InferenceSession, env } from "onnxruntime-web";
	import Stage from "$lib/components/SAM_Segmentation/Stage.svelte";
	import { v4 as uuid } from "uuid";
	import {
		arrayToImageData,
		ImageDataToArray,
		imageDataToImage,
		arrayToMask,
		compressor,
		decompressor,
	} from "$lib/components/SAM_Segmentation/maskUtils";
	import { handleImageScale } from "$lib/components/SAM_Segmentation/scaleHelper";
	import { modelData } from "$lib/components/SAM_Segmentation/onnxModelAPI";
	import Modal from "$lib/components/Modal.svelte";

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
			const fetch_annotations = await fetch(`/annotations/${data.props.id}`);
			if (!fetch_annotations.ok) {
				savedMaskImgs = [];
				return;
			}
			const annotations = await fetch_annotations.json();
			loadSavedMaskImgs(annotations);
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
		savedOutput = arrayToMask(output.data, output.dims[2], output.dims[3]);
		const renderOutput = arrayToImageData(savedOutput.arr, savedOutput.width, savedOutput.height);
		maskImg = imageDataToImage(renderOutput);
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

	const saveSavedImgMasks = () => {
		const saveContent = savedMaskImgs.map((savedMaskImg) => {
			console.log("savedMaskImg arr", savedMaskImg.output.arr);
			const arr = compressor(savedMaskImg.output.arr);
			console.log("arr", arr);
			return {
				id: savedMaskImg.id,
				output: {
					arr: arr,
					width: savedMaskImg.output.width,
					height: savedMaskImg.output.height,
				},
				clicks: savedMaskImg.clicks,
				name: savedMaskImg.name,
				description: savedMaskImg.description,
			};
		});
		return JSON.stringify(saveContent);
	};

	const loadSavedMaskImgs = (jsondata) => {
		savedMaskImgs = jsondata.map((savedMaskImg) => {
			return {
				id: savedMaskImg.id,
				output: {
					arr: decompressor(savedMaskImg.output.arr),
					width: savedMaskImg.output.width,
					height: savedMaskImg.output.height,
				},
				clicks: savedMaskImg.clicks,
				name: savedMaskImg.name,
				description: savedMaskImg.description,
			};
		});
		console.log("savedMaskImgs", savedMaskImgs);
		if (savedMaskImgs && savedMaskImgs.length > 0) {
			const renderOutput = arrayToImageData(
				savedMaskImgs[0].output.arr,
				savedMaskImgs[0].output.width,
				savedMaskImgs[0].output.height
			);
			maskImg = imageDataToImage(renderOutput);
			clicks = savedMaskImgs[0].clicks;
			savedOutput = savedMaskImgs[0].output;
		}
	};

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
	const handleSave = async (event) => {
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
		const jsonString = saveSavedImgMasks();
		console.log("jsonString", jsonString);
		const response = await fetch(`/annotations/${data.props.id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: jsonString,
		});
		if (!response.ok) {
			console.error("Error while saving annotations, try again.");
			return;
		} else {
			console.log("annotations saved");
		}
	};
	const handleSelect = (event) => {
		console.log("handleSelect", event.detail);
		if (event.detail && savedMaskImgs && savedMaskImgs.length > 0) {
			const savedMaskImg = savedMaskImgs.find((savedMaskImg) => savedMaskImg.id === event.detail);
			if (savedMaskImg) {
				savedOutput = savedMaskImg.output;
				savedClicks = savedMaskImg.clicks;
				const renderOutput = arrayToImageData(
					savedMaskImg.output.arr,
					savedMaskImg.output.width,
					savedMaskImg.output.height
				);
				maskImg = imageDataToImage(renderOutput);
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
		const jsonContent = saveSavedImgMasks();
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
					const jsondata = JSON.parse(jsonContent);
					// Process your data here
					loadSavedMaskImgs(jsondata);
					console.log(jsondata);
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
	width="max-w-max"
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
