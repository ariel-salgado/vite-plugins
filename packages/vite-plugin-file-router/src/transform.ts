import { SINGLE_URL_PATTERNS, SRCSET_PATTERNS } from './constants.js';
import { rewrite_srcset, to_root_path } from './utils.js';

/**
 * Rewrite all relative asset paths in an HTML string to root-relative paths.
 * All regexes are pre-compiled in constants.ts — zero compilation here.
 */
export function rewriteAssetPaths(html: string, html_abs: string, project_root: string): string {
	let result = html;

	for (const pattern of SINGLE_URL_PATTERNS) {
		pattern.lastIndex = 0;
		result = result.replace(pattern, (_m, prefix, quote, value, closing) =>
			`${prefix}${quote}${to_root_path(value, html_abs, project_root)}${closing}`);
	}

	for (const pattern of SRCSET_PATTERNS) {
		pattern.lastIndex = 0;
		result = result.replace(pattern, (_m, prefix, quote, srcset, closing) =>
			`${prefix}${quote}${rewrite_srcset(srcset, html_abs, project_root)}${closing}`);
	}

	return result;
}
