import type { ResolvedFileRouterOptions, RouteEntry } from '../src/types.js';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes_to_rollup_input, scan_routes } from '../src/glob.js';
import { walk_html_files } from '../src/utils.js';

vi.mock('../src/utils.js', async (import_original) => {
	const actual = await import_original<typeof import('../src/utils.js')>();
	return { ...actual, walk_html_files: vi.fn() };
});

const mock_walk = vi.mocked(walk_html_files);

const ROOT = '/project';
const ABS_DIR = '/project/src/pages';

const opts = (overrides: Partial<ResolvedFileRouterOptions> = {}): ResolvedFileRouterOptions => ({
	dir: 'src/pages',
	include: ['**/*.html'],
	exclude: [],
	assetsDir: '_static',
	verbose: false,
	root: ROOT,
	...overrides,
});

const abs = (rel: string) => `${ABS_DIR}/${rel}`;

beforeEach(() => {
	mock_walk.mockReset();
});

describe('scan_routes', () => {
	it('returns matched entries sorted alphabetically', async () => {
		mock_walk.mockResolvedValue([abs('index.html'), abs('about.html'), abs('blog/post.html')]);

		const result = await scan_routes(opts());

		expect(result.map(e => e.name)).toEqual(['about', 'blog/post', 'index']);
	});

	it('builds correct RouteEntry shape', async () => {
		mock_walk.mockResolvedValue([abs('about.html')]);

		const [entry] = await scan_routes(opts());

		expect(entry).toEqual({
			name: 'about',
			abs_path: abs('about.html'),
			rel_path: 'about.html',
		});
	});

	it('filters by glob include pattern', async () => {
		mock_walk.mockResolvedValue([abs('index.html'), abs('admin/index.html')]);

		const result = await scan_routes(opts({ include: ['admin/**/*.html'] }));

		expect(result.map(e => e.name)).toEqual(['admin/index']);
	});

	it('filters by RegExp include pattern', async () => {
		mock_walk.mockResolvedValue([abs('index.html'), abs('admin/index.html'), abs('about.html')]);

		const result = await scan_routes(opts({ include: [/^admin\//] }));

		expect(result.map(e => e.name)).toEqual(['admin/index']);
	});

	it('includes files matching glob OR regexp when both are present', async () => {
		mock_walk.mockResolvedValue([abs('index.html'), abs('about.html'), abs('admin/index.html')]);

		const result = await scan_routes(opts({ include: ['index.html', /^admin\//] }));

		expect(result.map(e => e.name)).toEqual(['admin/index', 'index']);
	});

	it('applies exclude patterns after include', async () => {
		mock_walk.mockResolvedValue([abs('index.html'), abs('_partial.html'), abs('about.html')]);

		const result = await scan_routes(opts({ exclude: ['_*.html'] }));

		expect(result.map(e => e.name)).toEqual(['about', 'index']);
	});

	it('exclude takes priority over include', async () => {
		mock_walk.mockResolvedValue([abs('admin/index.html')]);

		const result = await scan_routes(opts({ include: ['**/*.html'], exclude: ['admin/**'] }));

		expect(result).toHaveLength(0);
	});

	it('warns when no files are matched', async () => {
		mock_walk.mockResolvedValue([]);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

		await scan_routes(opts());

		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});

	it('returns empty array when no files are matched', async () => {
		mock_walk.mockResolvedValue([]);
		vi.spyOn(console, 'warn').mockImplementation(() => { });

		expect(await scan_routes(opts())).toEqual([]);
	});
});

describe('routes_to_rollup_input', () => {
	it('maps entry names to absolute paths', () => {
		const entries: RouteEntry[] = [
			{ name: 'index', abs_path: abs('index.html'), rel_path: 'index.html' },
			{ name: 'about', abs_path: abs('about.html'), rel_path: 'about.html' },
			{ name: 'blog/post', abs_path: abs('blog/post.html'), rel_path: 'blog/post.html' },
		];

		expect(routes_to_rollup_input(entries)).toEqual({
			'index': abs('index.html'),
			'about': abs('about.html'),
			'blog/post': abs('blog/post.html'),
		});
	});

	it('returns empty object for empty input', () => {
		expect(routes_to_rollup_input([])).toEqual({});
	});
});
