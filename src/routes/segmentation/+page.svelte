<script>
	import { onMount } from "svelte";
	import { InferenceSession, Tensor, env } from "onnxruntime-web";
	import npyjs from "npyjs";
	import Stage from "$lib/components/Stage.svelte";
	import { v4 as uuid } from "uuid";
	import { handleImageScale } from "$lib/components/models/SAM/scaleHelper";
	import {
		arrayToImageData,
		imageDataToImage,
		compressor,
		decompressor,
	} from "$lib/components/models/SAM//maskUtils";
	import { modelData } from "$lib/components/models/SAM/onnxModelAPI";

	export let IMAGE_PATH = "./assets/data/image3.jpg";
	export let IMAGE_EMBEDDING = "./assets/data/embedding.npy";
	export let MODEL_DIR = "./model/sam_onnx_quantized.onnx";

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

	onMount(async () => {
		if (MODEL_DIR) {
			try {
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
					colorSpace: img.output.colorSpace,
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
							output: {
								colorSpace: img.output.colorSpace,
								height: img.output.height,
								width: img.output.width,
								data: decompressor(img.output.data),
							},
						};
					});

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
	{image}
	{maskImg}
	{savedClicks}
	{savedMaskImgs}
/>
