import { shadowDOM } from '@ariel-salgado/vite-plugin-shadow-dom';
import { defineConfig } from 'vite';

export default defineConfig({
	appType: 'mpa',
	plugins: [
		shadowDOM(),
	],
});
