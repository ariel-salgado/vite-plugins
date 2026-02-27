import { describe, expect, it } from 'vitest';
import {
	extract_assets,
	find_element_by_id,
	get_attr,
	slice_body,
} from '../../src/process/html';

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
	it('extracts stylesheet links and module scripts', () => {
		const html = `
			<head>
				<link rel="stylesheet" href="/assets/index.css">
				<link rel="icon" href="/favicon.ico">
			</head>

			<body>
				<script type="module" src="/assets/index.js"></script>
			</body>
		`;

		const result = extract_assets(html);
		expect(result.css_hrefs).toEqual(['/assets/index.css']);
		expect(result.js_srcs).toEqual(['/assets/index.js']);
		expect(result.html).not.toContain('index.css');
		expect(result.html).not.toContain('index.js');
		expect(result.html).toContain('favicon.ico');
	});

	it('collects multiple CSS chunks and JS modules', () => {
		const html = `
			<link rel="stylesheet" href="/a.css">
			<link rel="stylesheet" href="/b.css">
			<script type="module" src="/a.js"></script>
			<script type="module" src="/b.js"></script>
		`;

		const result = extract_assets(html);
		expect(result.css_hrefs).toEqual(['/a.css', '/b.css']);
		expect(result.js_srcs).toEqual(['/a.js', '/b.js']);
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

	it('uses lastIndexOf for </body> to handle edge cases', () => {
		const html = `<body><script>const s = '</body>';</script></body>`;
		const result = slice_body(html);
		expect(result).not.toBeNull();
		expect(result!.content).toContain('const s = \'</body>\'');
	});

	it('returns null when body is absent', () => {
		expect(slice_body('<html><head></head></html>')).toBeNull();
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
});
