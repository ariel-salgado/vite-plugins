import type { ResolvedOptions } from '../../src/types.js';

import { describe, expect, it } from 'vitest';
import { DEFAULT_PLUGIN_OPTIONS } from '../../src/constants.js';
import { transform_html } from '../../src/process/transform.js';
import { read_fixture } from '../helpers.js';

const base_opts = DEFAULT_PLUGIN_OPTIONS as ResolvedOptions;

describe('transform_html', () => {
	it('wraps only #app in the shadow template', () => {
		const html = read_fixture('with-siblings.html');
		const result = transform_html(html, base_opts);
		expect(result).toContain('<template id="shadow-template">');
		expect(result).toContain('id="app"');
		expect(result).toContain('id="shadow-host"');
	});

	it('handles a page with no body siblings', () => {
		const html = read_fixture('simple.html');
		const result = transform_html(html, base_opts);
		expect(result).toContain('id="shadow-host"');
		expect(result).toContain('Hello world');
	});

	it('leaves sibling elements in the regular document', () => {
		const html = read_fixture('with-siblings.html');
		const result = transform_html(html, base_opts);
		expect(result).toContain('<div>header</div>');
		expect(result).toContain('<div>footer</div>');
	});

	it('extracts script src into bootstrap import', () => {
		const html = read_fixture('with-siblings.html');
		const result = transform_html(html, base_opts);
		expect(result).toContain('import(\'/assets/index.js\')');
		expect(result).not.toContain('<script type="module" src="/assets/index.js">');
	});

	it('extracts all CSS hrefs and JS srcs from fixture with multiple assets', () => {
		const html = read_fixture('with-assets.html');
		const result = transform_html(html, base_opts);
		expect(result).toContain('/assets/index-Dt4BqWtC.css');
		expect(result).toContain('/assets/vendor-CXs3H1aB.css');
		expect(result).toContain('import(\'/assets/index-Bb-pexYh.js\')');
		expect(result).toContain('import(\'/assets/vendor-D3kQz1Rp.js\')');
		expect(result).not.toContain('<link rel="stylesheet" href="/assets/index-Dt4BqWtC.css">');
	});

	it('returns original html when appId element is not found', () => {
		const html = read_fixture('no-app.html');
		const result = transform_html(html, base_opts);
		expect(result).toBe(html);
	});

	it('returns original html when using a custom appId that does not exist', () => {
		const html = read_fixture('with-siblings.html');
		const result = transform_html(html, { ...base_opts, appId: 'nonexistent' });
		expect(result).toBe(html);
	});

	it('exposes shadow root global before JS import', () => {
		const html = read_fixture('with-siblings.html');
		const result = transform_html(html, base_opts);
		const global_idx = result.indexOf('window[\'__shadowRoot\']');
		const import_idx = result.indexOf('import(\'/assets/index.js\')');
		expect(global_idx).toBeGreaterThan(-1);
		expect(import_idx).toBeGreaterThan(-1);
		expect(global_idx).toBeLessThan(import_idx);
	});

	it('uses custom hostId and templateId', () => {
		const html = read_fixture('simple.html');
		const result = transform_html(html, { ...base_opts, hostId: 'my-host', templateId: 'my-tpl' });
		expect(result).toContain('id="my-host"');
		expect(result).toContain('id="my-tpl"');
	});

	it('preserves non-stylesheet link tags', () => {
		const html = read_fixture('with-assets.html');
		const result = transform_html(html, base_opts);
		expect(result).toContain('favicon.ico');
	});
});
