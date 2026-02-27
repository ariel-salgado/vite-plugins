import type { HTMLBeautifyOptions } from 'js-beautify';

import beautify from 'js-beautify';

import { DEFAULT_BEAUTIFY_OPTIONS } from '../constants';

export function format_html(html: string, options?: HTMLBeautifyOptions): string {
	return beautify.html(html, { ...DEFAULT_BEAUTIFY_OPTIONS, ...options });
}
