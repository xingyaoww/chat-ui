<script lang="ts">
	console.log("hello");
	import { base } from "$app/paths";
	export let json = {
		url: "https://via.placeholder.com/400x400",
		id: "1234",
	};
	$: console.log("json", json);
</script>

<div class="image">
	<img class="img" src={base + "/images/" + json.id} />
</div>
