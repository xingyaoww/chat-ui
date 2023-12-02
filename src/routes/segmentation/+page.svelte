<script>
	import { onMount } from "svelte";
	import { InferenceSession, Tensor, env } from "onnxruntime-web";
	import npyjs from "npyjs";
	import Stage from "$lib/components/Stage.svelte";
	import { v4 as uuid } from "uuid";
	import { handleImageScale } from "$lib/components/models/SAM/scaleHelper";
	import { onnxMaskToImage } from "$lib/components/models/SAM//maskUtils";
	import { modelData } from "$lib/components/models/SAM/onnxModelAPI";
	import { randomUUID } from "$lib/utils/randomUuid";

	export let IMAGE_PATH = "src/assets/data/image3.jpg";
	export let IMAGE_EMBEDDING = "src/assets/data/embedding.npy";
	export let MODEL_DIR = "src/model/sam_onnx_quantized.onnx";

	let model;
	let tensor;
	let modelScale;
	let image;
	let maskImg;
	let savedMaskImgs = [];
	let clicks = []; // Replace with your actual logic for handling clicks
	let savedClicks = [];
	let savedOutput;

	onMount(async () => {
		if (MODEL_DIR) {
			try {
				env.wasm.wasmPaths = "node_modules/onnxruntime-web/dist/";
				model = await InferenceSession.create(MODEL_DIR, { executionProviders: ["wasm"] });
				console.log("model instantiated", model);
			} catch (e) {
				console.error("cannot instantiate", e);
			}
		}

		loadImage(new URL(IMAGE_PATH, window.location.origin));

		tensor = await loadNpyTensor(IMAGE_EMBEDDING, "float32");
	});

	async function loadImage(url) {
		try {
			const img = new Image();
			img.src = url.href;
			img.onload = () => {
				modelScale = handleImageScale(img);
				image = img;
			};
		} catch (error) {
			console.error(error);
		}
	}

	async function loadNpyTensor(tensorFile, dType) {
		let npLoader = new npyjs();
		const npArray = await npLoader.load(tensorFile);
		return new Tensor(dType, npArray.data, npArray.shape);
	}

	async function runONNX() {
		if (!model || !clicks || !tensor || !modelScale || clicks == []) return;

		const feeds = modelData({ clicks, tensor, modelScale });
		if (!feeds) return;

		const results = await model.run(feeds);
		const output = results[model.outputNames[0]];
		savedOutput = output;
		maskImg = onnxMaskToImage(output.data, output.dims[2], output.dims[3]);
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
		savedMaskImgs = [
			...savedMaskImgs,
			{ id: uuid(), output: savedOutput, clicks: savedClicks, maskImg, ...event.detail },
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
				maskImg = savedMaskImg.maskImg;
			}
		} else {
			savedOutput = null;
			savedClicks = [];
			maskImg = null;
		}
	};
</script>

<Stage
	on:mouseHover={handleMouseHover}
	on:mouseClick={handleMouseClick}
	on:mouseOut={handleMouseOut}
	on:undo={handleUndo}
	on:save={handleSave}
	on:select={handleSelect}
	{image}
	{maskImg}
	{savedClicks}
	{savedMaskImgs}
/>
