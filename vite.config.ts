import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";
import copy from "rollup-plugin-copy";

export default defineConfig({
	plugins: [
		sveltekit(),
		Icons({
			compiler: "svelte",
		}),
		copy({
			targets: [
				{ src: "node_modules/onnxruntime-web/dist/**/*", dest: "static/onnxruntime-web" },
				{ src: "node_modules/onnxruntime-web/webgpu/**/*", dest: "static/onnxruntime-web/webgpu" },
			],
		}),
	],
	optimizeDeps: {
		include: ["browser-image-resizer"],
	},
});
