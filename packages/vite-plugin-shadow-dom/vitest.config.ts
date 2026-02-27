import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		projects: [
			{
				test: {
					name: 'unit',
					include: ['test/unit/**/*.test.ts'],
					environment: 'node',
				},
			},
			{
				test: {
					name: 'browser',
					include: ['test/browser/**/*.test.ts'],
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: 'chromium' }],
					},
				},
			},
		],
	},
});
