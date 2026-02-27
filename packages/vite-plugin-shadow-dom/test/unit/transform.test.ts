import type { ResolvedOptions } from '../../src/types.js';

import { describe, expect, it } from 'vitest';
import { DEFAULT_PLUGIN_OPTIONS } from '../../src/constants.js';
import { transform_html } from '../../src/process/transform.js';

const base_opts = DEFAULT_PLUGIN_OPTIONS as ResolvedOptions;

const FULL_PAGE = `
	<!doctype html>
	<html lang="es-CL">

	<head>
		<meta charset="UTF-8" />
		<title>test</title>
	</head>
	<body>
		<div>header</div>
		<div id="app"><p>hello</p></div>
		<div>footer</div>
		<script type="module" src="/assets/index.js"></script>
	</body>
	</html>
`;

describe('transform_html', () => {
	it('wraps only #app in the shadow template', () => {
		const result = transform_html(FULL_PAGE, base_opts);
		expect(result).toContain('<template id="shadow-template">');
		expect(result).toContain('<div id="app"><p>hello</p></div>');
		expect(result).toContain('<div id="shadow-host"></div>');
	});

	it('leaves header and footer divs in the regular document', () => {
		const result = transform_html(FULL_PAGE, base_opts);
		expect(result).toContain('<div>header</div>');
		expect(result).toContain('<div>footer</div>');
	});

	it('extracts script src into bootstrap import', () => {
		const result = transform_html(FULL_PAGE, base_opts);
		expect(result).toContain('import(\'/assets/index.js\')');
		expect(result).not.toContain('<script type="module" src="/assets/index.js">');
	});

	it('extracts CSS href into shadow injection', () => {
		const html = FULL_PAGE.replace(
			'<meta charset="UTF-8" />',
			'<meta charset="UTF-8" />\n  <link rel="stylesheet" href="/assets/index.css">',
		);
		const result = transform_html(html, base_opts);
		expect(result).toContain('/assets/index.css');
		expect(result).not.toContain('<link rel="stylesheet" href="/assets/index.css">');
	});

	it('returns original html when appId element is not found', () => {
		const result = transform_html(FULL_PAGE, { ...base_opts, appId: 'nonexistent' });
		expect(result).toBe(FULL_PAGE);
	});

	it('exposes shadow root global before JS import', () => {
		const result = transform_html(FULL_PAGE, base_opts);
		const global_idx = result.indexOf('window[\'__shadowRoot\']');
		const import_idx = result.indexOf('import(\'/assets/index.js\')');
		expect(global_idx).toBeLessThan(import_idx);
	});

	it('uses custom hostId and templateId', () => {
		const opts = { ...base_opts, hostId: 'my-host', templateId: 'my-tpl' };
		const result = transform_html(FULL_PAGE, opts);
		expect(result).toContain('id="my-host"');
		expect(result).toContain('id="my-tpl"');
	});

	it('handles a page with no body siblings (full body wrap fallback)', () => {
		const simple = `<html><body><div id="app">content</div></body></html>`;
		const result = transform_html(simple, base_opts);
		expect(result).toContain('<div id="shadow-host"></div>');
		expect(result).toContain('content');
	});
});
