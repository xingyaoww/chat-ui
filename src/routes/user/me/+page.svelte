<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import Modal from "$lib/components/Modal.svelte";
	import CarbonClose from "~icons/carbon/close";

	let username = "";
	let isLoggedIn = false;
	export let closeRoute = "/"; // Default route to navigate to when the popup is closed

	onMount(async () => {
		// Check if there is a JWT cookie
		const response = await fetch(`${base}/user/login`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		console.log("response", response);
		if (!response.ok) {
			// Handle error
			console.error("No user cookies");
			goto("/user/login");
			return;
		}
		// Set the isLoggedIn variable
		isLoggedIn = true;
		const fetchResponse = await fetch(`${base}/user/me`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (fetchResponse.ok) {
			const result = await fetchResponse.json();
			username = result.username;
		} else {
			console.log("Could not fetch user data");
		}
	});

	const handleLogout = async () => {
		// Call the backend server to logout the user
		const response = await fetch(`${base}/user/logout`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (response.ok) {
			// Remove the JWT cookie
			isLoggedIn = false;
			goto("/user/login");
		} else {
			// Handle logout error
			console.error("Logout failed");
		}
	};
</script>

<Modal>
	<div
		class="min-w-400 relative flex w-full flex-col items-center gap-6 from-primary-500/40 via-primary-500/10 to-primary-500/0 px-5 pb-8 pt-9 text-center"
	>
		<div class="flex items-start justify-between text-xl font-semibold text-gray-800">
			<div class="absolute right-2 top-2">
				<button type="button" class="group" on:click={() => goto(closeRoute)}>
					<CarbonClose class="text-gray-900 group-hover:text-gray-500" />
				</button>
			</div>
			<h2 class="">User</h2>
		</div>
		{#if isLoggedIn}
			<img
				src="https://eu.ui-avatars.com/api/?name=John+Doe&size=300"
				alt="user icon"
				class="h-14 w-14 rounded-full"
			/>
			<h3>{username}</h3>
			<button
				type="button"
				class="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-600"
				on:click={handleLogout}
			>
				Logout
			</button>
		{/if}
	</div>
</Modal>
