import type { ResolvedFileRouterOptions, RouteEntry } from './types.js';

import picomatch from 'picomatch';

import { relative, resolve } from 'node:path';
import { PLUGIN_TAG } from './constants.js';
import { walk_html_files } from './utils.js';

/**
 * Walk the pages directory and return all matching route entries.
 *
 * - Pure glob includes  → picomatch filter only
 * - Any RegExp present  → picomatch + regexp tested in a single pass
 * - A file is included if it matches ANY include entry (OR logic)
 * - A file is excluded if it matches ANY exclude pattern
 */
export async function scan_routes(options: ResolvedFileRouterOptions): Promise<RouteEntry[]> {
	const { dir, include, exclude, root } = options;
	const abs_dir = resolve(root, dir);

	const globs = include.filter((e): e is string => typeof e === 'string');
	const regexps = include.filter((e): e is RegExp => e instanceof RegExp);

	const glob_match = globs.length > 0 ? picomatch(globs) : null;
	const exclude_match = exclude.length > 0 ? picomatch(exclude) : null;

	const all_files = await walk_html_files(abs_dir);

	const matched = all_files.filter((abs_path) => {
		const rel = relative(abs_dir, abs_path);
		if (exclude_match?.(rel))
			return false;
		if (glob_match?.(rel))
			return true;
		return regexps.some(re => re.test(rel));
	});

	if (matched.length === 0) {
		console.warn(`${PLUGIN_TAG} No routes found in "${abs_dir}" for the given include rules.`);
	}

	return matched.sort().map((abs_path) => {
		const rel_path = relative(abs_dir, abs_path);
		return { name: rel_path.replace(/\.html$/, ''), abs_path, rel_path };
	});
}

/**
 * Convert an array of RouteEntry into a Rollup input map.
 */
export function routes_to_rollup_input(entries: RouteEntry[]): Record<string, string> {
	return Object.fromEntries(entries.map(e => [e.name, e.abs_path]));
}

/**
 * Log all discovered routes to the console.
 * Only called when verbose: true.
 */
export function log_discovered_routes(entries: RouteEntry[]): void {
	const pad = Math.max(...entries.map(e => e.name.length), 4);
	const lines = entries.map(e => `  • ${e.name.padEnd(pad)}  →  ${e.rel_path}`).join('\n');
	console.info(`${PLUGIN_TAG} Found ${entries.length} route(s):\n${lines}`);
}
