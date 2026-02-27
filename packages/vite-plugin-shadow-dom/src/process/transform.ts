import type { ResolvedOptions } from '../types.js';

import { extract_assets, find_element_by_id, slice_body } from './html.js';
import { build_bootstrap_script } from './inject.js';

/**
 * Full HTML transformation pipeline.
 *
 * When appId is set (default: 'app'):
 *   - Finds the element with that id in the body
 *   - Replaces it in-place with the shadow host div
 *   - Appends the template and bootstrap script at the end of body
 *   - Everything else in the body remains untouched
 *
 * Returns the original HTML unchanged if the target element cannot be found.
 */
export function transform_html(html: string, opts: ResolvedOptions): string {
	const { html: stripped, css_hrefs, js_srcs } = extract_assets(html);

	const slice = find_element_by_id(stripped, opts.appId);
	if (!slice)
		return html;

	const body_slice = slice_body(`${slice.before}PLACEHOLDER${slice.after}`);
	if (!body_slice)
		return html;

	const script = build_bootstrap_script(css_hrefs, js_srcs, opts);

	const injection = `
		<div id="${opts.hostId}"></div>

		<template id="${opts.templateId}">
			${slice.element.trim()}
		</template>

		${script}
  	`;

	const body_with_host = body_slice.content.replace('PLACEHOLDER', injection);

	return body_slice.before + body_with_host + body_slice.after;
}
