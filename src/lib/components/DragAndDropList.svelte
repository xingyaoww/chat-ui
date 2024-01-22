<script lang="ts">
	import { add } from "date-fns";
	import type { Writable } from "svelte/store";

	export let name: string;
	export let list: Writable<string[]>;
	let draggedItem: number | null = null;
	let editableIndex: number | null = null;
	let editableItemValue: string = "";

	function onDragStart(event: DragEvent, index: number): void {
		draggedItem = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
		}
	}

	function onDragOver(event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	function onDrop(event: DragEvent, targetIndex: number): void {
		if (draggedItem !== null) {
			list.update((l) => {
				l.splice(targetIndex, 0, l.splice(draggedItem as number, 1)[0]);
				return l;
			});
			draggedItem = null;
		}
	}

	function removeItem(index: number): void {
		list.update((l) => {
			l.splice(index, 1);
			return l;
		});
	}

	function editItem(index: number): void {
		editableIndex = index;
		list.subscribe((l) => {
			editableItemValue = l[index];
		})();
	}

	function saveEdit(): void {
		if (editableIndex !== null) {
			list.update((l) => {
				l[editableIndex as number] = editableItemValue;
				return l;
			});
			editableIndex = null;
		}
	}

	function cancelEdit(): void {
		editableIndex = null;
	}
	function addNewItem(): void {
		list.update((l) => {
			l.push("");
			editableIndex = l.length - 1;
			return l;
		});
	}
</script>

<div class="flex flex-row items-center gap-2">
	<h4 class="text-lg font-semibold text-gray-800">{name}</h4>
	<button
		class="ml-auto underline decoration-gray-300 hover:decoration-gray-700"
		on:click={addNewItem}
	>
		Add New Item
	</button>
</div>
<div class="flex flex-col gap-2">
	{#each $list as item, index (item)}
		<div
			class="m-2 flex flex-col gap-2"
			draggable="true"
			on:dragstart={(event) => onDragStart(event, index)}
			on:dragover={onDragOver}
			on:drop={(event) => onDrop(event, index)}
		>
			<div
				class={"flex flex-row items-center gap-2" + (editableIndex ? "rounded-md border-2" : "")}
			>
				{#if editableIndex === index}
					<textarea
						rows="10"
						class="w-full resize-none rounded-md border-2 bg-gray-100 p-2"
						bind:value={editableItemValue}
					/>
					<button
						class="ml-auto underline decoration-gray-300 hover:decoration-gray-700"
						on:click={saveEdit}
					>
						Save
					</button>
					<button
						class="ml-auto underline decoration-gray-300 hover:decoration-gray-700"
						on:click={cancelEdit}
					>
						Cancel
					</button>
				{:else}
					<p class="text-lg font-semibold text-gray-800">{index + 1}. {item}</p>
					<button
						class="ml-auto underline decoration-gray-300 hover:decoration-gray-700"
						on:click={() => editItem(index)}
					>
						Edit
					</button>
					<button
						class="ml-auto underline decoration-gray-300 hover:decoration-gray-700"
						on:click|stopPropagation={() => removeItem(index)}
					>
						Remove
					</button>
				{/if}
			</div>
		</div>
	{/each}
</div>
