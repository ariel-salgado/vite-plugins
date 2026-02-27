import { defineConfig } from 'vite';
import { shadowDOM } from '@ariel-salgado/vite-plugin-shadow-dom';

export default defineConfig({
	appType: "mpa",
	plugins: [
		shadowDOM()
	]
})
