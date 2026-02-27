import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		dom: 'src/dom/index.ts',
	},
	format: ['esm'],
	dts: true,
	clean: true,
	platform: 'node',
	treeshake: true,
});
