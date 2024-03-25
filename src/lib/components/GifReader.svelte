<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	export let image_lists: Record<string, string>[] = [];
	export let tracked_states: Record<string, any> = {};

	let ifAnimated = false;
	let images: string[] = [];
	// download the images from the image_lists

	let currentIndex = "1";
	let frameDict = {};
	let interval: NodeJS.Timeout;
	let localURLs: Record<string, any>[] = [];
	let finished = false;
	onMount(() => {
		images = image_lists.map((image) => "/images/" + image.id);
		localURLs = [];
		// if (images.length > 5) {
		// 	images = images.slice(0, 2).concat(images.slice(-3));
		// }
		images.forEach((imageURL, i) => {
			fetch(imageURL)
				.then((response) => response.blob())
				.then((blob) => {
					localURLs[String(i + 1)] = URL.createObjectURL(blob);
					finished = true;
				});
		});
		frameDict = tracked_states["frames"].reduce((acc, frame, i) => {
			acc[String(i + 1)] = frame;
			return acc;
		}, {});

		return () => {
			images.forEach((imageURL, i) => {
				URL.revokeObjectURL(localURLs[String(i + 1)]);
			});
		};
	});

	// Reactive statement to manage the interval based on ifAnimated
	$: {
		if (interval) {
			clearInterval(interval); // Clear existing interval if any
			interval = undefined; // Reset interval variable
		}

		if (ifAnimated) {
			interval = setInterval(() => {
				currentIndex = String((Number(currentIndex) % images.length) + 1);
			}, 1000);
		}
	}

	// Cleanup to clear the interval when the component is destroyed
	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

<div>
	<!-- create a list of button of index of frames -->
	{#if images.length > 0}
		<div class={`grid grid-rows-${images.length}  grid-flow-col gap-4`}>
			<button
				class={"m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"}
				on:click={() => (ifAnimated = !ifAnimated)}
			>
				{ifAnimated ? "Stop" : "Start"} Animation
			</button>
			{#each Object.entries(localURLs) as [index, _]}
				<button
					on:click={() => {
						currentIndex = index;
					}}
					class={"m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400" +
						(currentIndex === index ? " bg-gray-200" : "")}
				>
					{index}
				</button>
			{/each}
		</div>
		{#if finished && localURLs && localURLs.length > 0}
			<div class={`grid grid-cols-2`}>
				<img src={localURLs[currentIndex]} alt="motion" />

				{#if frameDict}
					<div class={`flex flex-col`}>
						{#if tracked_states["frames"][currentIndex] && tracked_states["frames"][currentIndex]["objects"] && tracked_states["frames"][currentIndex]["objects"].length > 0}
							<div class={`flex flex-col`}>
								<h2>Objects</h2>
								<table class="">
									{#each frameDict[currentIndex]["objects"] as obj}
										<tr class="bg-gray-100 capitalize">
											{#each Object.keys(obj) as key}
												<th>{key}</th>
											{/each}
										</tr>
										<tr>
											{#each Object.keys(obj) as key}
												<td>{obj[key]}</td>
											{/each}
										</tr>
									{/each}
								</table>
							</div>
						{/if}
						{#if frameDict[currentIndex] && frameDict[currentIndex]["relations"] && frameDict[currentIndex]["relations"].length > 0}
							<div class={`flex flex-col`}>
								<h2>Relations</h2>
								<table>
									<tr class="bg-gray-100 capitalize">
										{#each Object.keys(frameDict[currentIndex]["relations"][0]) as key}
											<th>{key}</th>
										{/each}
									</tr>
									{#each frameDict[currentIndex]["relations"] as obj}
										<tr>
											{#each Object.keys(obj) as key}
												<td>{obj[key]}</td>
											{/each}
										</tr>
									{/each}
								</table>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
		<!-- {#if tracked_states["explanation"]}
			<h2>Explanation</h2>
			<p>{tracked_states["explanation"]}</p>
		{/if} -->
	{/if}
</div>
