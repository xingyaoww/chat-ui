<script>
	import { createEventDispatcher } from "svelte";
	export let savedMaskImgs = [];
	let selectedImageId = "";
	let editableLabel = "";
	let editableDescription = "";
	const dispatch = createEventDispatcher();

	function handleImageSelection(event) {
		event.preventDefault();
		selectedImageId = event.target.value;
	}

	$: dispatch("update", {
		id: selectedImageId,
		name: editableLabel,
		description: editableDescription,
	});
</script>

<div class="panel">
	<select
		class="resize-none scroll-p-3 overflow-x-hidden overflow-y-scroll border-0 bg-transparent p-3 outline-none focus:ring-0 focus-visible:ring-0"
		on:change={handleImageSelection}
	>
		<option value="">Choose An Annotation</option>
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
