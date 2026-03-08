import type { FileRouterOptions, RouteEntry } from './types.js';
import type { Plugin, UserConfig, ViteDevServer } from 'vite';

import { mkdir, rename, rm } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { PLUGIN_TAG } from './constants.js';
import { log_discovered_routes, routes_to_rollup_input, scan_routes } from './glob.js';
import { rewriteAssetPaths } from './transform.js';
import { build_route_map, cleanup_empty_parents, find_matching_route, resolve_options } from './utils.js';

/**
 * Vite plugin that auto-discovers all .html files in a directory
 * and registers them as MPA entry points.
 *
 * - Relative asset paths in HTML are rewritten to root-relative paths automatically
 * - Bundled assets are emitted under `assetsDir` (default `_static`) to avoid route collisions
 * - HTML files are flattened to the dist root after build
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import { file_router } from 'vite-plugin-file-router'
 *
 * export default defineConfig({
 *   plugins: [
 *     file_router({
 *       dir: 'src/pages',
 *       include: ['**\/*.html', /special\/.*\.html$/],
 *       exclude: ['_*.html'],
 *       assetsDir: '_static',
 *       verbose: true,
 *     })
 *   ],
 * })
 */
export function fileRouter(options: FileRouterOptions = {}): Plugin {
	const resolved = resolve_options(options);

	let routes: RouteEntry[] = [];
	let route_map: Map<string, RouteEntry> = new Map();

	return {
		name: 'vite-plugin-file-router',
		enforce: 'pre',

		async config(user_config): Promise<UserConfig> {
			routes = await scan_routes(resolved);
			route_map = build_route_map(routes);

			if (resolved.verbose)
				log_discovered_routes(routes);

			return {
				build: {
					assetsDir: resolved.assetsDir,
					rollupOptions: {
						...user_config.build?.rollupOptions,
						input: {
							...(user_config.build?.rollupOptions?.input as Record<string, string> | undefined),
							...routes_to_rollup_input(routes),
						},
					},
				},
			};
		},

		transformIndexHtml: {
			order: 'pre',
			handler(html, ctx) {
				if (!ctx.filename)
					return html;
				return rewriteAssetPaths(html, ctx.filename, resolved.root);
			},
		},

		configureServer(server: ViteDevServer) {
			server.middlewares.use((req, _res, next) => {
				const raw_url = req.url ?? '/';
				const pathname = raw_url.split('?')[0];

				if (extname(pathname) !== '')
					return next();

				const match = find_matching_route(pathname, route_map);

				if (match) {
					const from_root = `/${relative(resolved.root, match.abs_path).replace(/\\/g, '/')}`;
					req.url = raw_url.includes('?')
						? `${from_root}?${raw_url.split('?')[1]}`
						: from_root;
				}

				next();
			});
		},

		async writeBundle(output_opts) {
			const abs_out = resolve(resolved.root, output_opts.dir ?? 'dist');
			const nested_root = resolve(abs_out, relative(resolved.root, resolve(resolved.root, resolved.dir)));

			await Promise.all(
				routes.map(async (route) => {
					const nested = resolve(nested_root, route.rel_path);
					const flat = resolve(abs_out, route.rel_path);
					try {
						await mkdir(dirname(flat), { recursive: true });
						await rename(nested, flat);
						if (resolved.verbose) {
							console.info(`${PLUGIN_TAG} moved  ${relative(abs_out, nested)}  →  ${relative(abs_out, flat)}`);
						}
					}
					catch {
						// file wasn't emitted — skip silently
					}
				}),
			);

			await rm(nested_root, { recursive: true, force: true });
			await cleanup_empty_parents(nested_root, abs_out);
		},
	};
}
