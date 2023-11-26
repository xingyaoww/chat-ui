<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import Modal from "$lib/components/Modal.svelte";
	import CarbonClose from "~icons/carbon/close";

	let username = "";
	let password = "";
	let isRegistered = false;
	let error = "";
	export let closeRoute = "/"; // Default route to navigate to when the popup is closed

	onMount(async () => {
		// Check if there is a JWT cookie
		const jwtCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("jwt="));

		if (jwtCookie) {
			isRegistered = true;
		}
	});
	const handleRegister = async () => {
		// Call the backend server to authenticate the user
		const response = await fetch(`${base}/user/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }),
		});

		if (response.ok) {
			// Set the JWT cookie
			isRegistered = true;
		} else {
			// Handle login error
			response.json().then((data) => {
				error = data.error;
			});
			return;
		}
	};
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
			isRegistered = false;
		} else {
			// Handle logout error
			console.error("Logout failed");
		}
	};
	const handleSignIn = async () => {
		goto("/user/login");
	};
</script>

<Modal on:close>
	<div
		class="relative flex w-full flex-col items-center gap-6 from-primary-500/40 via-primary-500/10 to-primary-500/0 px-5 pb-8 pt-9 text-center"
	>
		<div class="flex items-start justify-between text-xl font-semibold text-gray-800">
			<div class="absolute right-2 top-2">
				<button type="button" class="group" on:click={() => goto(closeRoute)}>
					<CarbonClose class="text-gray-900 group-hover:text-gray-500" />
				</button>
			</div>
			<h2 class="">Sign Up</h2>
		</div>

		<div class="mt-2 px-7 py-3">
			<p class="text-sm text-gray-500">
				{#if isRegistered}
					<p>Already logged in</p>
					<button
						class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
						on:click={handleLogout}>Logout</button
					>
				{:else}
					<form on:submit|preventDefault={handleRegister}>
						{#if error && error !== ""}
							<p class="text-sm italic text-red-500">{error}</p>
						{/if}
						<label for="username" class="">Username:</label>
						<input
							class="my-2 border border-gray-200"
							type="text"
							id="username"
							bind:value={username}
							required
						/>

						<label for="password">Password:</label>
						<input
							class="my-2 border border-gray-200"
							type="password"
							id="password"
							bind:value={password}
							required
						/>
						<br />
						<button
							type="submit"
							class="blue m-4 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
							>Register</button
						>
					</form>
					<button
						class="m-4 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
						on:click={handleSignIn}>Return to Sign In</button
					>
				{/if}
			</p>
		</div>
	</div>
</Modal>
