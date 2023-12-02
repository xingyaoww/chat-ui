<script>
	export let savedMaskImgs = [];
	let selectedImageId = "";
	let editableLabel = "";
	let editableDescription = "";
    const dispatch = createEventDispatcher();

	function handleImageSelection(event) {
		selectedImageId.set(event.target.value);
	}

	$: if (selectedImageId) {
		const selected = savedMaskImgs.find((img) => img.id === selectedImageId);
		if (selected) {
			editableLabel = selected.label;
			editableDescription = selected.description;
		} 
	}
</script>

<div class="panel">
	<select on:change={handleImageSelection}>
		<option value="">Select an Image</option>
		{#each savedMaskImgs as img}
			<option value={img.id}>{img.name}</option>
		{/each}
	</select>

	<input
		type="text"
		class="resize-none scroll-p-3 overflow-x-hidden overflow-y-scroll border-0 bg-transparent p-3 outline-none focus:ring-0 focus-visible:ring-0"
		bind:value={editableLabel}
		placeholder="Label"
	/>
	<textarea
		class="resize-none scroll-p-3 overflow-x-hidden overflow-y-scroll border-0 bg-transparent p-3 outline-none focus:ring-0 focus-visible:ring-0"
		bind:value={editableDescription}
		placeholder="Description"
	/>
</div>

<style>
	.panel {
		border: #ccc 1px solid;
		border-radius: 10px;
		padding: 15px;
		margin: 10px 0;
	}

	.panel-heading,
	.panel-description,
	select,
	input,
	textarea {
		width: 100%;
		margin-bottom: 10px;
	}

	input,
	textarea {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 10px;
	}
</style>
