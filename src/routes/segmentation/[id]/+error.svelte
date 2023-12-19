<script>
	import { page } from "$app/stores";
	import Modal from "$lib/components/Modal.svelte";
	import CarbonClose from "~icons/carbon/close";
</script>

<Modal
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
	</div>
	<div class="m-3 flex flex-col items-center justify-center text-center">
		<p class="text-lg font-medium text-gray-700">
			Image embedding is currently processing. <br />
			Please refresh the page in a few minutes to check if it is done.
		</p>
		<br />
		<button
			class="rounded bg-blue-500 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 hover:bg-blue-300"
			on:click={() => {
				window.location.reload();
			}}
		>
			Refresh Page
		</button>
	</div>
	<br />
</Modal>
