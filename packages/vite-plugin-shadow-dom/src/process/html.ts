import type { BodySlice, ElementSlice, ExtractedAssets } from '../types';

import { VOID_TAGS } from '../constants';

/**
 * Strips all Vite-injected <link rel="stylesheet"> and <script type="module" src="...">
 * tags from HTML, collecting their URLs for manual injection into the shadow root.
 * Non-stylesheet links (favicon, preload, etc.) and inline module scripts are preserved.
 */
export function extract_assets(html: string): ExtractedAssets {
	const css_hrefs: string[] = [];
	const js_srcs: string[] = [];

	html = html.replace(/<link\b[^>]*>/g, (tag) => {
		if (get_attr(tag, 'rel') === 'stylesheet') {
			const href = get_attr(tag, 'href');
			if (href)
				css_hrefs.push(href);
			return '';
		}
		return tag;
	});

	html = html.replace(/<script\b[^>]*><\/script>/g, (tag) => {
		if (get_attr(tag, 'type') === 'module') {
			const src = get_attr(tag, 'src');
			if (src)
				js_srcs.push(src);
			return '';
		}
		return tag;
	});

	return { html, css_hrefs, js_srcs };
}

/**
 * Splits HTML around the <body> element using index-based slicing.
 * Immune to </body> strings inside scripts or templates.
 */
export function slice_body(html: string): BodySlice | null {
	const body_open = html.indexOf('<body');
	if (body_open === -1)
		return null;

	const tag_end = html.indexOf('>', body_open);
	if (tag_end === -1)
		return null;

	const body_start = tag_end + 1;
	const body_end = html.lastIndexOf('</body>');
	if (body_end === -1)
		return null;

	return {
		before: html.slice(0, body_start),
		content: html.slice(body_start, body_end),
		after: html.slice(body_end),
	};
}

/**
 * Finds and extracts an element by id from an HTML string using nesting-aware scanning.
 * Supports any depth of same-tag nesting. Only supports id= attribute selectors.
 * Returns null if the element is not found or the HTML is malformed.
 */
export function find_element_by_id(html: string, id: string): ElementSlice | null {
	const id_re = new RegExp(`<(\\w+)\\b[^>]*\\bid="${id}"[^>]*>`, 'i');
	const match = id_re.exec(html);
	if (!match)
		return null;

	const tag_name = match[1].toLowerCase();
	const tag_start = match.index;
	const opening_end = tag_start + match[0].length;

	if (VOID_TAGS.has(tag_name) || match[0].endsWith('/>')) {
		return {
			before: html.slice(0, tag_start),
			element: match[0],
			after: html.slice(opening_end),
		};
	}

	const open_seq = `<${tag_name}`;
	const close_seq = `</${tag_name}`;

	let pos = opening_end;
	let depth = 1;

	while (depth > 0 && pos < html.length) {
		const next_open = html.indexOf(open_seq, pos);

		let next_close = html.indexOf(close_seq, pos);
		while (next_close !== -1) {
			const c = html[next_close + close_seq.length];
			if (c === '>' || c === ' ' || c === '\n' || c === '\t' || c === '\r')
				break;
			next_close = html.indexOf(close_seq, next_close + 1);
		}

		if (next_close === -1)
			return null; // malformed HTML

		if (next_open !== -1 && next_open < next_close) {
			const char_after = html[next_open + open_seq.length];
			if (
				char_after === '>'
				|| char_after === ' '
				|| char_after === '\n'
				|| char_after === '\t'
				|| char_after === '\r'
				|| char_after === '/'
			) {
				depth++;
				pos = next_open + open_seq.length;
			}
			else {
				pos = next_open + 1;
			}
		}
		else {
			depth--;
			const close_end = html.indexOf('>', next_close) + 1;
			if (close_end === 0)
				return null;
			if (depth === 0) {
				return {
					before: html.slice(0, tag_start),
					element: html.slice(tag_start, close_end),
					after: html.slice(close_end),
				};
			}
			pos = close_end;
		}
	}

	return null;
}

/**
 * Extracts the value of a named attribute from an HTML opening tag string.
 * Order-independent — works regardless of attribute position in the tag.
 */
export function get_attr(tag: string, attr: string): string | undefined {
	return tag.match(new RegExp(`\\b${attr}="([^"]+)"`))?.[1];
}
