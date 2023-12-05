import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";
import topLevelAwait from "vite-plugin-top-level-await";

import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	plugins: [
		topLevelAwait(),
		sveltekit(),
		Icons({
			compiler: "svelte",
		}),
		viteStaticCopy({
			targets: [
				{
					src: "node_modules/onnxruntime-web/dist/*.wasm",
					dest: ".",
				},
				{
					src: "src/assets/*",
					dest: "./assets",
				},
				{
					src: "src/model/*",
					dest: "./model",
				},
			],
		}),
	],
});
