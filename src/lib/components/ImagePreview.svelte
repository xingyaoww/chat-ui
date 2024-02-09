<script lang="ts">
	import { base } from "$app/paths";
	import { createEventDispatcher } from "svelte";
	import CarbonClose from "~icons/carbon/close";
	import CarbonSubtract from "~icons/carbon/subtract";
	import CarbonEdit from "~icons/carbon/edit";
	import { goto } from "$app/navigation";
	export let json = {
		url: "https://via.placeholder.com/400x400",
		id: "1234",
	};
	export let mode = "0";
	export let clickHandler: (image: Image) => void = () => {};
	const dispatch = createEventDispatcher<{ deleteImage: void }>();

	function deleteImage() {
		// Implement the logic for deleting the image
		fetch(`${base + json.url}`, {
			method: "DELETE",
			headers: {
				accept: "application/json",
			},
		});
		dispatch("deleteImage");
	}
	function removeImage() {
		// Implement the logic for deleting the image
		dispatch("deleteImage");
	}

	function editImage() {
		// Implement the logic for editing the image
		goto(`${base}/segmentation/${json.id}`);
	}
</script>

<div class="border-grey-300 relative m-4 inline-block rounded-lg border hover:border-red-400">
	<img
		class="h-24 w-24 min-w-24 max-w-24 rounded-xl object-cover"
		src={base + json.url}
		alt="Image"
		on:click={clickHandler}
	/>
	<!-- <button
		class="absolute -bottom-3 -right-3 cursor-pointer rounded-full bg-yellow-400 px-2 py-1 text-white"
		on:click={editImage}>✎</button
	> -->
	{#if mode === "1"}
		<button
			class="absolute -right-3 -top-3 cursor-pointer rounded-full bg-red-400 p-2 text-white"
			on:click={deleteImage}><CarbonSubtract /></button
		>
	{:else}
		<button
			class="absolute -right-3 -top-3 cursor-pointer rounded-full bg-gray-400 p-2 text-white"
			on:click={removeImage}><CarbonClose /></button
		>
	{/if}
	<button
		class="absolute -bottom-3 -right-3 cursor-pointer rounded-full bg-yellow-400 p-2 text-white"
		on:click={editImage}><CarbonEdit /></button
	>
</div>
