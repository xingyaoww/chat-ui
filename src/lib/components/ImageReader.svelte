<script lang="ts">
	console.log("hello");
	export let json = {
		url: "https://via.placeholder.com/400x400",
	};
	$: console.log("json", json);
</script>

<div class="image">
	<img class="img" src={json.url ?? "https://via.placeholder.com/400x400"} />
</div>
