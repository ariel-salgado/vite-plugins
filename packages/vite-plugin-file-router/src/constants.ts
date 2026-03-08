import type { FileRouterOptions } from './types.js';

export const PLUGIN_TAG = '[vite-plugin-file-router]';

export const DEFAULTS = {
	dir: 'src/pages',
	include: ['**/*.html'] as (string | RegExp)[],
	exclude: [] as string[],
	assetsDir: '_static',
	verbose: false,
	root: process.cwd(),
} as const satisfies Required<FileRouterOptions>;

/** Tag → attributes that hold a single resolvable URL. */
export const SINGLE_URL_ATTRS: Record<string, string[]> = {
	script: ['src'],
	link: ['href'],
	img: ['src'],
	source: ['src'],
	video: ['src'],
	audio: ['src'],
};

/** Tags whose attribute holds a srcset string (comma-separated "url descriptor" pairs). */
export const SRCSET_ATTRS: Record<string, string[]> = {
	img: ['srcset'],
	source: ['srcset'],
};

/**
 * Negative lookahead baked into single-URL regexes.
 * Prevents matching root-relative, absolute, data URIs, anchors, and empty values.
 */
export const SKIP_LOOKAHEAD = '(?![/#]|https?:|data:|mailto:|$)';

/**
 * Pre-compiled regexes for single-URL attributes.
 * Built once at module load — zero re-compilation per file.
 */
export const SINGLE_URL_PATTERNS: RegExp[] = Object.entries(SINGLE_URL_ATTRS).flatMap(
	([tag, attrs]) =>
		attrs.map(
			attr => new RegExp(`(<${tag}[^>]*\\s${attr}=)(["'])${SKIP_LOOKAHEAD}([^"']+)(\\2)`, 'gi'),
		),
);

/**
 * Pre-compiled regexes for srcset attributes.
 * Built once at module load — zero re-compilation per file.
 */
export const SRCSET_PATTERNS: RegExp[] = Object.entries(SRCSET_ATTRS).flatMap(
	([tag, attrs]) =>
		attrs.map(
			attr => new RegExp(`(<${tag}[^>]*\\s${attr}=)(["'])([^"']*)(\\2)`, 'gi'),
		),
);
