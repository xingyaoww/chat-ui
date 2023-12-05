<script>
	// You can define functions to handle button clicks here
	export let handleAdd = () => {
		console.log("Add clicked");
	};

	export let handleMinus = () => {
		console.log("Minus clicked");
	};

	export let handleRemove = () => {
		console.log("Remove clicked");
	};

	export let handleSave = () => {
		console.log("Save clicked");
	};

	export let handleDelete = () => {
		console.log("Delete clicked");
	};

	export let handleDownload = () => {
		console.log("Download clicked");
	};
</script>

<div class="toolbar">
	<div class="button-group">
		<button on:click={handleAdd} class="bg-blue-500">
			<i class="fa fa-plus" />
		</button>
		Add
	</div>
	<div class="button-group">
		<button on:click={handleMinus} class="bg-red-500">
			<i class="fa-solid fa-minus" />
		</button>
		Minus
	</div>
	<div class="button-group">
		<button on:click={handleSave} class="bg-green-500">
			<i class="fa-solid fa-floppy-disk" />
		</button>
		Save
	</div>
	<div class="button-group">
		<button on:click={handleRemove} class="bg-yellow-500">
			<i class="fa-solid fa-rotate-left" />
		</button>
		Undo
	</div>
	<br class="border" />
	<div class="button-group">
		<button on:click={handleDelete} class="bg-red-500">
			<i class="fa-solid fa-trash" />
		</button>
		Delete
	</div>

	<div class="button-group">
		<button on:click={handleDownload} class="bg-green-500">
			<i class="fa-solid fa-download" />
		</button>
		Download
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		background-color: transparent;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 10px;
		margin: 10px;
	}

	.toolbar button {
		color: white;
		width: 30px;
		height: 30px;
		margin: 5px;
		border-radius: 10px;
		cursor: pointer;
		border-radius: 5px;
		font-size: 16px;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	/* .toolbar button:hover {
		background-color: #45a049;
	} */
</style>
