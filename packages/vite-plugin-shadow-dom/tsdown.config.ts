import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: {
			index: 'src/index.ts',
		},
		format: ['esm'],
		shims: true,
		dts: true,
		clean: true,
		exports: true,
		platform: 'node',
	},
	{
		entry: {
			client: 'src/client/index.ts',
		},
		format: ['esm'],
		shims: true,
		dts: true,
		clean: true,
		exports: true,
		platform: 'browser',
	},
]);
