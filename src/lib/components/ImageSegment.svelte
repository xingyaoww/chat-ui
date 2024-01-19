<script lang="ts">
	// @ts-nocheck
	import { base } from "$app/paths";
	import {
		arrayToImageData,
		arrayToMask,
		imageDataToImage,
	} from "$lib/components/SAM_Segmentation/maskUtils";
	import { throttle } from "lodash-es";
	import npyjs from "npyjs";
	// Ensure lodash-es is installed
	import Tool from "$lib/components/SAM_Segmentation/Tool.svelte";
	import { modelData } from "$lib/components/SAM_Segmentation/onnxModelAPI";
	import { handleImageScale } from "$lib/components/SAM_Segmentation/scaleHelper";
	import { InferenceSession, env } from "onnxruntime-web";
	import { createEventDispatcher, onMount } from "svelte";

	import * as ort from "onnxruntime-web";
	export let json = {
		url: "https://via.placeholder.com/400x400",
		id: "1234",
	};
	$: console.log("json", json);

	export let MODEL_DIR = new URL(
		"$lib/components/SAM_Segmentation/model/sam_onnx_quantized.onnx",
		import.meta.url
	).href;
	/** @type {import('./$types').PageData} */
	export let data;
	// Function to load the tensor from a npy file
	async function loadNpyTensor(tensorFile, dType) {
		const npLoader = new npyjs();
		const npArray = await npLoader.load(tensorFile);
		return new ort.Tensor(dType, npArray.data, npArray.shape);
	}

	console.log("data", data);

	let model;
	let tensor;
	let modelScale;
	let image;
	let maskImg;
	let savedMaskImgs = [];
	let clicks = []; // Replace with your actual logic for handling clicks
	let savedClicks = [];
	let savedOutput;
	let isLoading = true; // New variable to track loading state
	const dispatch = createEventDispatcher();

	async function clipMaskOntoBackground(mask, backgroundImg) {
		// Create a canvas for the output
		let canvas = document.createElement("canvas");

		canvas.width = backgroundImg.width;
		canvas.height = backgroundImg.height;
		let ctx = canvas.getContext("2d");

		// Draw the background image
		ctx.drawImage(backgroundImg, 0, 0);

		// Set the composite operation to 'destination-in' to use the mask
		ctx.globalCompositeOperation = "destination-in";

		// Draw the mask image, which will clip the background image
		ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);

		// Set the composite operation to 'destination-over' to fill the rest with white
		// ctx.globalCompositeOperation = "destination-over";
		// ctx.fillStyle = "white";
		// ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Prepare the file to be sent in a FormData object
		const formData = new FormData();

		const imageURL = canvas.toDataURL("image/jpeg");
		const blob = await fetch(imageURL).then((res) => res.blob());
		formData.append("file", blob);

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
			const reponsejson = { id: result.id, url: result.url };
			dispatch("segmentImageUpload", reponsejson);
		} else {
			console.error("Upload failed", response);
		}
	}

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
		const image_response = await fetch(`${base}/images/${json.id}`);
		if (!image_response.ok) {
			isLoading = false;
			return;
		}
		const image_data = await image_response.arrayBuffer();
		const img = new Image();
		img.src = URL.createObjectURL(new Blob([image_data]));
		img.onload = () => {
			modelScale = handleImageScale(img);
			image = img;
		};
		const tensor_response = await fetch(`${base}/embeddings/${json.id}`);
		if (!tensor_response.ok) {
			isLoading = false;
			return;
		}
		const embeddingResponse = await tensor_response.arrayBuffer();
		tensor = await loadNpyTensor(embeddingResponse, "float32");
		console.log("image", image);
		console.log("tensor", tensor);
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
		// if (maskImg) {
		// 	URL.revokeObjectURL(maskImg.src);
		// }
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

	function handleMouseMove(event: MouseEvent) {
		if (!event.target) return;
		let el = event.target as HTMLElement; // Type assertion
		const rect = el.getBoundingClientRect();
		let x = event.clientX - rect.left;
		let y = event.clientY - rect.top;
		const imageScale = image ? image.width / el.offsetWidth : 1;
		x *= imageScale;
		y *= imageScale;
		const click = getClick(x, y);

		clicks = [click];
	}

	const throttledMouseMove = throttle(handleMouseMove, 15);

	function getClick(x: number, y: number) {
		return { x, y, clickType: 1 };
	}
	const handleMouseClick = async (event: MouseEvent) => {
		// Replace with your actual logic for handling clicks
		// savedClicks = [click];
		if (maskImg && image) await clipMaskOntoBackground(maskImg, image);
	};
	const throttledMouseClick = throttle(handleMouseClick, 30);

	const handleMouseOut = () => {
		// Replace with your logic to defer setting maskImg to null
		if (!savedMaskImgs) {
			maskImg = null;
		}
	};
</script>

<div class="flex w-full flex-col gap-5 p-6">
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="flex items-center justify-center">
				<div class="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900" />
			</div>
		</div>
	{:else}
		<Tool
			handleMouseMove={throttledMouseMove}
			handleMouseClick={throttledMouseClick}
			{handleMouseOut}
			{image}
			{maskImg}
			{savedMaskImgs}
			{savedClicks}
			{modelScale}
		/>
	{/if}
</div>
