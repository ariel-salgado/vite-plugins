import type { HTMLBeautifyOptions } from 'js-beautify';

import { html as beautify_html } from 'js-beautify';
import { DEFAULT_OPTIONS } from '../constants';

export function format_html(
	html: string,
	options?: HTMLBeautifyOptions,
): string {
	return beautify_html(html, {
		...DEFAULT_OPTIONS,
		...options,
	});
}
