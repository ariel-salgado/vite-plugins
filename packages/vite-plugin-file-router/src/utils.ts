import type { FileRouterOptions, ResolvedFileRouterOptions, RouteEntry } from './types.js';

import { readdir, rmdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { DEFAULTS } from './constants.js';

export function resolve_options(options: FileRouterOptions): ResolvedFileRouterOptions {
	return { ...DEFAULTS, ...options };
}

/**
 * Recursively walk a directory and return all .html file paths (absolute).
 * Uses Node 18+ native fs.readdir with { recursive: true }.
 */
export async function walk_html_files(abs_dir: string): Promise<string[]> {
	const entries = await readdir(abs_dir, { recursive: true, withFileTypes: true });
	return entries
		.filter(e => e.isFile() && e.name.endsWith('.html'))
		.map(e => join(e.parentPath, e.name));
}

/**
 * Try to remove each directory segment between `nested_root` and `abs_out` (exclusive),
 * walking upward. Uses non-recursive rmdir — silently fails on non-empty dirs.
 *
 * Example: nested_root = dist/src/pages, abs_out = dist
 *   → attempts rmdir on dist/src/pages, then dist/src
 */
export async function cleanup_empty_parents(nested_root: string, abs_out: string): Promise<void> {
	const parts = relative(abs_out, nested_root).split(sep);
	const dirs = Array.from({ length: parts.length }, (_, i) =>
		resolve(abs_out, ...parts.slice(0, parts.length - i)));
	await Promise.allSettled(dirs.map(dir => rmdir(dir)));
}

/**
 * Build a lookup map from route name → RouteEntry for O(1) dev-server matching.
 * Also indexes "name/index" → entry so both /about and /about/ resolve correctly.
 */
export function build_route_map(entries: RouteEntry[]): Map<string, RouteEntry> {
	const map = new Map<string, RouteEntry>();
	for (const entry of entries) {
		map.set(entry.name, entry);
		if (entry.name.endsWith('/index')) {
			map.set(entry.name.slice(0, -'/index'.length), entry);
		}
	}
	return map;
}

/**
 * Find the RouteEntry for an incoming URL pathname.
 *
 * Matching rules:
 *  1. Exact:      /about  → "about"
 *  2. Index:      /about/ → "about/index"
 *  3. Root index: /       → "index"
 */
export function find_matching_route(
	pathname: string,
	route_map: Map<string, RouteEntry>,
): RouteEntry | undefined {
	const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
	return route_map.get(clean) ?? route_map.get(clean ? `${clean}/index` : 'index');
}

/**
 * Resolve a relative path to a root-relative absolute path.
 * e.g. "../lib/main.ts" from "src/pages/index.html" → "/src/lib/main.ts"
 */
export function to_root_path(raw: string, html_abs: string, project_root: string): string {
	return `/${relative(project_root, resolve(dirname(html_abs), raw)).replace(/\\/g, '/')}`;
}

/**
 * Rewrite a full srcset string, resolving each relative URL in the list.
 * Preserves descriptors (1x, 2x, 200w, etc.) exactly as-is.
 *
 * Input:  "../img/hero.png 1x, ../img/hero@2x.png 2x"
 * Output: "/src/img/hero.png 1x, /src/img/hero@2x.png 2x"
 */
export function rewrite_srcset(srcset: string, html_abs: string, project_root: string): string {
	// data: URIs can contain commas in their base64 payload — bail out immediately
	// rather than trying to split them as a srcset candidate list.
	if (srcset.startsWith('data:'))
		return srcset;
	return srcset.replace(/([^\s,]+)(\s[^,]+)?(,|$)/g, (match, url, descriptor, comma) => {
		if (url.startsWith('/') || url.startsWith('http') || url.startsWith('data:'))
			return match;
		return to_root_path(url, html_abs, project_root) + (descriptor ?? '') + comma;
	});
}
