<script>
	import { goto } from "$app/navigation";
	let password = "";
	import { base } from "$app/paths";

	function handleSubmit() {
		fetch(`${base}/password`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ password }),
		})
			.then((res) => {
				if (res.ok) {
					console.log("Password correct");
					goto(`${base}/`);
				} else {
					alert("Incorrect password");
				}
			})
			.catch((err) => {
				console.error(err);
				alert("An error occurred. Please try again later.");
			});
	}
</script>

<main>
	<h1>ECOLE MIRACLE</h1>

	<form on:submit|preventDefault={handleSubmit}>
		<label for="password">Password:</label>
		<input type="password" id="password" bind:value={password} />
		<button type="submit">Submit</button>
	</form>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	label {
		margin-bottom: 0.5rem;
	}

	input {
		padding: 0.5rem;
		margin-bottom: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
	}
</style>
