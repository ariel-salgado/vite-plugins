import { defineConfig } from '@ariel-salgado/eslint-config';

const config = defineConfig({
	type: 'lib',
	typescript: true,
	ignores: [
		'**/tests/**/fixtures/**',
		'playgrounds/**/*',
		'.changeset/*.md',
	],
});

export default config;
