import type { ResolvedOptions, ShadowDOMOptions } from './types.js';
import type { Plugin } from 'vite';

import { DEFAULT_PLUGIN_OPTIONS } from './constants.js';
import { format_html } from './process/format.js';
import { transform_html } from './process/transform.js';

function build_exclude_predicate(
	exclude: ShadowDOMOptions['exclude'],
): (filename: string) => boolean {
	if (!exclude)
		return () => false;
	if (typeof exclude === 'function')
		return exclude;
	return (filename: string) => exclude.some(pattern => filename.includes(pattern));
}

function resolve_format_option(
	options: ShadowDOMOptions['formatOutput'],
): ResolvedOptions['formatOutput'] {
	if (options === false)
		return false;
	if (options === true || options === undefined)
		return {};
	return options;
}

function resolve_options(options: ShadowDOMOptions): ResolvedOptions {
	const merged = { ...DEFAULT_PLUGIN_OPTIONS, ...options } as ResolvedOptions;

	return {
		...merged,
		exclude: build_exclude_predicate(options.exclude),
		formatOutput: resolve_format_option(options.formatOutput),
	};
}

export function shadowDOM(options: ShadowDOMOptions = {}): Plugin {
	const resolved = resolve_options(options);

	return {
		name: '@ariel-salgado/vite-plugin-shadow-dom',
		enforce: 'post',
		transformIndexHtml: {
			order: 'post',
			handler(html, ctx) {
				if (resolved.exclude(ctx.filename))
					return html;
				return transform_html(html, resolved);
			},
		},
		generateBundle(_, bundle) {
			if (resolved.formatOutput === false)
				return;

			for (const filename of Object.keys(bundle)) {
				const chunk = bundle[filename];
				if (chunk.type === 'asset' && filename.endsWith('.html')) {
					const source = chunk.source as string;
					chunk.source = format_html(
						source,
						resolved.formatOutput,
					);
				}
			}
		},
	};
}
