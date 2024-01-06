<script>
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	let naturalWidth = 0;
	let naturalHeight = 0;
	let width = 0;
	let height = 0;
	let scale = 1;
	export let data = {
		type: "ecole-grounding-data",
		image_id: "6597d4e81e62848822d531c9",
		objects: [
			{
				label: 1,
				score: 0.7849028706550598,
				"bounding-box": [6.0844221115112305, 28.98036003112793, 296.04638671875, 346.0781555175781],
			},
		],
	};
	const handleAnnotationClick = () => {
		console.log("Edit Image", data.image_id);
		goto(`${base}/segmentation/${data.image_id}`);
	};
	const onLoadImage = (event) => {
		const img = event.target;
		naturalWidth = img.naturalWidth;
		naturalHeight = img.naturalHeight;
		width = img.width;
		height = img.height;
		scale = width / naturalWidth;
		console.log("naturalWidth", naturalWidth);
		console.log("naturalHeight", naturalHeight);
		console.log("width", width);
		console.log("height", height);
		console.log("scale", scale);
	};
</script>

<div
	style={{
		position: "relative",
		width: "400px",
	}}
>
	<div style="position: relative;">
		<img class="img" src={base + "/images/" + data.image_id} alt="Image" on:load={onLoadImage} />

		<div>
			{#each data.objects as object}
				<div
					style="
                position: absolute;
                left: {object['bounding-box'][0] * scale}px;
                top: {object['bounding-box'][1] * scale}px;
                width: {(object['bounding-box'][2] - object['bounding-box'][0]) * scale}px;
                height: {(object['bounding-box'][3] - object['bounding-box'][1]) * scale}px;
                border: 3px solid red;
            "
				/>
				<div
					style="
                    position: absolute;
                    left: {object['bounding-box'][0] * scale}px;
                    top: {object['bounding-box'][1] * scale - 20}px;
                    background-color: red;
                    color: white;
                    padding: 2px;
                    font-size: 12px;
                "
				>
					{object.label}
				</div>
			{/each}
		</div>
	</div>

	<button
		class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
		on:click={handleAnnotationClick}
	>
		Open Image In Annotation Tool
	</button>
</div>
