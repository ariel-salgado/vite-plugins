import type { RouteEntry } from '../src/types.js';

import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/constants.js';
import {
	build_route_map,
	find_matching_route,
	resolve_options,
	rewrite_srcset,
	to_root_path,
} from '../src/utils.js';

describe('resolve_options', () => {
	it('fills all defaults when called with empty object', () => {
		const result = resolve_options({});
		expect(result.dir).toBe(DEFAULTS.dir);
		expect(result.include).toEqual(DEFAULTS.include);
		expect(result.exclude).toEqual(DEFAULTS.exclude);
		expect(result.assetsDir).toBe(DEFAULTS.assetsDir);
		expect(result.verbose).toBe(DEFAULTS.verbose);
		expect(result.root).toBe(DEFAULTS.root);
	});

	it('uses provided values over defaults', () => {
		const result = resolve_options({
			dir: 'pages',
			include: ['**/*.html', /special/],
			exclude: ['_*.html'],
			assetsDir: '_bundle',
			verbose: true,
			root: '/my/project',
		});
		expect(result.dir).toBe('pages');
		expect(result.include).toEqual(['**/*.html', /special/]);
		expect(result.exclude).toEqual(['_*.html']);
		expect(result.assetsDir).toBe('_bundle');
		expect(result.verbose).toBe(true);
		expect(result.root).toBe('/my/project');
	});

	it('uses defaults only for missing fields', () => {
		const result = resolve_options({ dir: 'custom/pages', verbose: true });
		expect(result.dir).toBe('custom/pages');
		expect(result.verbose).toBe(true);
		expect(result.assetsDir).toBe(DEFAULTS.assetsDir);
		expect(result.exclude).toEqual(DEFAULTS.exclude);
	});
});

const make_entry = (name: string): RouteEntry => ({
	name,
	abs_path: `/project/src/pages/${name}.html`,
	rel_path: `${name}.html`,
});

describe('build_route_map', () => {
	it('indexes entries by name', () => {
		const entries = [make_entry('index'), make_entry('about')];
		const map = build_route_map(entries);
		expect(map.get('index')).toBe(entries[0]);
		expect(map.get('about')).toBe(entries[1]);
	});

	it('indexes "section/index" also under "section"', () => {
		const entry = make_entry('blog/index');
		const map = build_route_map([entry]);
		expect(map.get('blog/index')).toBe(entry);
		expect(map.get('blog')).toBe(entry);
	});

	it('does not add a short alias for non-index entries', () => {
		const entry = make_entry('blog/post');
		const map = build_route_map([entry]);
		expect(map.has('blog')).toBe(false);
	});

	it('returns an empty map for empty input', () => {
		expect(build_route_map([]).size).toBe(0);
	});
});

describe('find_matching_route', () => {
	const entries = [
		make_entry('index'),
		make_entry('about'),
		make_entry('blog/index'),
		make_entry('blog/post'),
	];
	const map = build_route_map(entries);

	it('matches exact route: /about → about', () => {
		expect(find_matching_route('/about', map)).toBe(entries[1]);
	});

	it('matches root: / → index', () => {
		expect(find_matching_route('/', map)).toBe(entries[0]);
	});

	it('matches trailing slash via index alias: /blog/ → blog/index', () => {
		expect(find_matching_route('/blog/', map)).toBe(entries[2]);
	});

	it('matches nested exact route: /blog/post → blog/post', () => {
		expect(find_matching_route('/blog/post', map)).toBe(entries[3]);
	});

	it('returns undefined for unknown routes', () => {
		expect(find_matching_route('/does-not-exist', map)).toBeUndefined();
	});

	it('strips leading and trailing slashes before matching', () => {
		expect(find_matching_route('/about/', map)).toBe(entries[1]);
	});
});

describe('to_root_path', () => {
	const root = '/project';
	const html_abs = '/project/src/pages/index.html';

	it('resolves a sibling relative path', () => {
		expect(to_root_path('./main.ts', html_abs, root)).toBe('/src/pages/main.ts');
	});

	it('resolves a parent-traversing relative path', () => {
		expect(to_root_path('../lib/main.ts', html_abs, root)).toBe('/src/lib/main.ts');
	});

	it('resolves deep traversal', () => {
		expect(to_root_path('../../assets/style.css', html_abs, root)).toBe('/assets/style.css');
	});

	it('returns a path starting with /', () => {
		expect(to_root_path('../lib/main.ts', html_abs, root).startsWith('/')).toBe(true);
	});
});

describe('rewrite_srcset', () => {
	const root = '/project';
	const html_abs = '/project/src/pages/index.html';

	it('rewrites a single relative URL with no descriptor', () => {
		expect(rewrite_srcset('../img/hero.png', html_abs, root))
			.toBe('/src/img/hero.png');
	});

	it('rewrites a relative URL and preserves its descriptor', () => {
		expect(rewrite_srcset('../img/hero.png 1x', html_abs, root))
			.toBe('/src/img/hero.png 1x');
	});

	it('rewrites multiple entries and preserves all descriptors', () => {
		const input = '../img/hero.png 1x, ../img/hero@2x.png 2x';
		const output = '/src/img/hero.png 1x, /src/img/hero@2x.png 2x';
		expect(rewrite_srcset(input, html_abs, root)).toBe(output);
	});

	it('leaves root-relative URLs untouched', () => {
		expect(rewrite_srcset('/img/hero.png 1x', html_abs, root)).toBe('/img/hero.png 1x');
	});

	it('leaves absolute URLs untouched', () => {
		expect(rewrite_srcset('https://cdn.example.com/img.png 1x', html_abs, root))
			.toBe('https://cdn.example.com/img.png 1x');
	});

	it('leaves data URIs untouched', () => {
		const data = 'data:image/png;base64,abc123 1x';
		expect(rewrite_srcset(data, html_abs, root)).toBe(data);
	});

	it('handles mixed relative and absolute entries', () => {
		const input = '../img/a.png 1x, https://cdn.example.com/b.png 2x';
		const output = '/src/img/a.png 1x, https://cdn.example.com/b.png 2x';
		expect(rewrite_srcset(input, html_abs, root)).toBe(output);
	});
});
