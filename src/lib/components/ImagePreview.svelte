<script lang="ts">
	import { base } from "$app/paths";
	import { createEventDispatcher } from "svelte";
	export let json = {
		url: "https://via.placeholder.com/400x400",
		id: "1234",
	};
	export let mode = 0;
	export let clickHandler: (image: Image) => void = () => {};
	$: console.log("json", json);
	const dispatch = createEventDispatcher<{ deleteImage: void }>();

	function deleteImage() {
		// Implement the logic for deleting the image
		console.log("Delete Image", json.id);
		fetch(`${base}/images/${json.id}`, {
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
		console.log("Edit Image", json.id);
	}
</script>

<div class="border-grey-300 relative m-4 inline-block rounded-lg border hover:border-red-400">
	<img
		class="h-24 w-24 rounded-xl object-cover"
		src={base + "/images/" + json.id}
		alt="Image"
		on:click={clickHandler}
	/>
	<!-- <button
		class="absolute -bottom-3 -right-3 cursor-pointer rounded-full bg-yellow-400 px-2 py-1 text-white"
		on:click={editImage}>✎</button
	> -->
	{#if mode === "1"}
		<button
			class="absolute -right-3 -top-3 cursor-pointer rounded-full bg-red-400 px-3 py-1 text-white"
			on:click={deleteImage}>-</button
		>
	{:else}
		<button
			class="absolute -right-3 -top-3 cursor-pointer rounded-full bg-gray-400 px-2 text-white"
			on:click={removeImage}>x</button
		>
	{/if}
</div>
