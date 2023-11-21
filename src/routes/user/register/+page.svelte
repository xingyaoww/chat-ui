<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	let username = "";
	let password = "";
	let isLoggedIn = false;
	export let closeRoute = "/"; // Default route to navigate to when the popup is closed

	onMount(async () => {
		// Check if there is a JWT cookie
		const jwtCookie = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("jwt="));

		if (jwtCookie) {
			isLoggedIn = true;
		}
	});
	function close() {
		goto(closeRoute);
	}
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
			isLoggedIn = true;
		} else {
			// Handle login error
			console.error("Login failed");
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
			isLoggedIn = false;
		} else {
			// Handle logout error
			console.error("Logout failed");
		}
	};
	const handleSignIn = async () => {
		goto("/user/login");
	};
</script>

<div class="fixed inset-0 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
	<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
		<div class="items-right absolute right-0 top-0 px-4 py-3">
			<button on:click={close}>
				<i class="mi mi-close"><span class="u-sr-only" /></i>
			</button>
		</div>
		<div class="mt-3 text-center">
			<h3 class="text-lg font-medium leading-6 text-gray-900">Register</h3>
			<div class="mt-2 px-7 py-3">
				<p class="text-sm text-gray-500">
					{#if isLoggedIn}
						<p>Already logged in</p>
						<button
							class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
							on:click={handleLogout}>Logout</button
						>
					{:else}
						<form on:submit|preventDefault={handleRegister}>
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
								class="blue m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
								>Register</button
							>
						</form>
						<button
							class="m-4 rounded-lg border border-gray-200 px-2 py-2 text-sm shadow-sm transition-all hover:border-gray-300 active:shadow-inner dark:border-gray-600 dark:hover:border-gray-400"
							on:click={handleSignIn}>Return to Sign In</button
						>
					{/if}
				</p>
			</div>
		</div>
	</div>
</div>
