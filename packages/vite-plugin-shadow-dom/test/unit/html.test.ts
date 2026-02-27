import { describe, expect, it } from 'vitest';
import {
	extract_assets,
	find_element_by_id,
	get_attr,
	slice_body,
} from '../../src/process/html';
import { read_fixture } from '../helpers.js';

describe('get_attr', () => {
	it('extracts attribute regardless of position', () => {
		expect(get_attr('<link rel="stylesheet" href="/a.css">', 'href')).toBe('/a.css');
		expect(get_attr('<link href="/a.css" rel="stylesheet">', 'href')).toBe('/a.css');
	});

	it('returns undefined when attribute is absent', () => {
		expect(get_attr('<link rel="stylesheet">', 'href')).toBeUndefined();
	});
});

describe('extract_assets', () => {
	it('extracts all stylesheet links and module scripts from fixture', () => {
		const html = read_fixture('with-assets.html');
		const result = extract_assets(html);

		expect(result.css_hrefs).toEqual([
			'/assets/index-Dt4BqWtC.css',
			'/assets/vendor-CXs3H1aB.css',
		]);
		expect(result.js_srcs).toEqual([
			'/assets/index-Bb-pexYh.js',
			'/assets/vendor-D3kQz1Rp.js',
		]);
	});

	it('removes extracted tags from the returned html', () => {
		const html = read_fixture('with-assets.html');
		const result = extract_assets(html);

		expect(result.html).not.toContain('index-Dt4BqWtC.css');
		expect(result.html).not.toContain('vendor-CXs3H1aB.css');
		expect(result.html).not.toContain('index-Bb-pexYh.js');
		expect(result.html).not.toContain('vendor-D3kQz1Rp.js');
	});

	it('preserves non-stylesheet links', () => {
		const html = read_fixture('with-assets.html');
		const result = extract_assets(html);

		expect(result.html).toContain('favicon.ico');
	});

	it('preserves inline module scripts (no src)', () => {
		const html = `<script type="module">console.log('hi')</script>`;
		const result = extract_assets(html);
		expect(result.js_srcs).toHaveLength(0);
		expect(result.html).toContain('console.log(\'hi\')');
	});

	it('preserves non-module scripts', () => {
		const html = `<script src="/legacy.js"></script>`;
		const result = extract_assets(html);
		expect(result.js_srcs).toHaveLength(0);
		expect(result.html).toContain('/legacy.js');
	});

	it('returns empty arrays when no assets are present', () => {
		const html = read_fixture('no-app.html');
		const result = extract_assets(html);
		expect(result.css_hrefs).toHaveLength(0);
		expect(result.js_srcs).toHaveLength(0);
	});
});

describe('slice_body', () => {
	it('slices a basic body', () => {
		const html = `<html><head></head><body><div>hello</div></body></html>`;
		const result = slice_body(html);
		expect(result).not.toBeNull();
		expect(result!.content.trim()).toBe('<div>hello</div>');
		expect(result!.before).toContain('<body>');
		expect(result!.after).toBe('</body></html>');
	});

	it('uses lastIndexOf for </body> — immune to </body> strings inside scripts', () => {
		const html = `<body><script>const s = '</body>';</script></body>`;
		const result = slice_body(html);
		expect(result).not.toBeNull();
		expect(result!.content).toContain('const s = \'</body>\'');
	});

	it('returns null when body element is absent', () => {
		expect(slice_body('<html><head></head></html>')).toBeNull();
	});

	it('slices body from a real fixture', () => {
		const html = read_fixture('with-siblings.html');
		const result = slice_body(html);
		expect(result).not.toBeNull();
		expect(result!.content).toContain('id="app"');
		expect(result!.content).toContain('header');
		expect(result!.content).toContain('footer');
	});
});

describe('find_element_by_id', () => {
	it('finds a simple top-level element', () => {
		const html = `<body><div id="app"><p>hello</p></div></body>`;
		const result = find_element_by_id(html, 'app');
		expect(result).not.toBeNull();
		expect(result!.element.trim()).toBe('<div id="app"><p>hello</p></div>');
		expect(result!.before).toBe('<body>');
		expect(result!.after).toBe('</body>');
	});

	it('handles deeply nested same-tag children', () => {
		const html = `<div id="app"><div><div>deep</div></div></div>`;
		const result = find_element_by_id(html, 'app');
		expect(result!.element.trim()).toBe('<div id="app"><div><div>deep</div></div></div>');
	});

	it('leaves content before and after the element intact', () => {
		const html = `<body>\n\t<header>top</header>\n\t<div id="app">content</div>\n\t<footer>bottom</footer>\n</body>`;
		const result = find_element_by_id(html, 'app');
		expect(result!.before).toContain('<header>top</header>');
		expect(result!.after).toContain('<footer>bottom</footer>');
	});

	it('returns null when id is not found', () => {
		expect(find_element_by_id('<div id="other"></div>', 'app')).toBeNull();
	});

	it('handles attribute order variations', () => {
		const html = `<div class="foo" id="app">bar</div>`;
		const result = find_element_by_id(html, 'app');
		expect(result!.element.trim()).toBe('<div class="foo" id="app">bar</div>');
	});

	it('does not confuse <divider> with <div>', () => {
		const html = `<div id="app"><divider></divider></div>`;
		const result = find_element_by_id(html, 'app');
		expect(result!.element.trim()).toBe('<div id="app"><divider></divider></div>');
	});

	it('finds #app inside a real fixture with siblings', () => {
		const html = read_fixture('with-siblings.html');
		const result = find_element_by_id(html, 'app');
		expect(result).not.toBeNull();
		expect(result!.element).toContain('<p>hello</p>');
		expect(result!.before).toContain('<div>header</div>');
		expect(result!.after).toContain('<div>footer</div>');
	});

	it('returns null when fixture has no matching id', () => {
		const html = read_fixture('no-app.html');
		expect(find_element_by_id(html, 'app')).toBeNull();
	});
});
