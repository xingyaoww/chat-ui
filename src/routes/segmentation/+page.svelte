<script>
	import { onMount } from "svelte";
	import { InferenceSession, Tensor, env } from "onnxruntime-web";
	import npyjs from "npyjs";
	import Stage from "$lib/components/Stage.svelte";
	import { handleImageScale } from "$lib/components/models/SAM/scaleHelper";
	import { onnxMaskToImage } from "$lib/components/models/SAM//maskUtils";
	import { modelData } from "$lib/components/models/SAM/onnxModelAPI";

	const IMAGE_PATH = "src/assets/data/image3.jpg";
	const IMAGE_EMBEDDING = "src/assets/data/embedding.npy";
	const MODEL_DIR = "src/model/sam_onnx_quantized.onnx";

	let model;
	let tensor;
	let modelScale;
	let image;
	let maskImg;
	let clicks = []; // Replace with your actual logic for handling clicks

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
		if (!model || !clicks || !tensor || !modelScale) return;

		const feeds = modelData({ clicks, tensor, modelScale });
		if (!feeds) return;

		const results = await model.run(feeds);
		const output = results[model.outputNames[0]];
		console.log("output", output);
		maskImg = onnxMaskToImage(output.data, output.dims[2], output.dims[3]);
	}

	// Reactive statement to run the ONNX model when 'clicks' changes
	$: if (clicks) {
		runONNX();
	}

	// Function to handle mouse click event
	const handleMouseClick = (event) => {
		event.preventDefault();
		clicks = [event.detail.click];
	};
</script>

<Stage on:mouseClick={handleMouseClick} {image} {maskImg} {clicks} />
