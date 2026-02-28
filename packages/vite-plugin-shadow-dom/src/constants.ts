import type { ResolvedOptions } from './types';
import type { HTMLBeautifyOptions } from 'js-beautify';

export const VOID_TAGS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
]);

export const DEFAULT_PLUGIN_OPTIONS: Partial<ResolvedOptions> = {
	mode: 'open',
	cssStrategy: 'link',
	hostId: 'shadow-host',
	templateId: 'shadow-template',
	delegatesFocus: true,
	serializable: true,
	appId: 'app',
	shadowRootGlobal: '__shadowRoot',
	patchDocument: true,
	formatOutput: true,
};

export const DOCUMENT_METHODS_TO_PATCH = [
	'getElementById',
	'querySelector',
	'querySelectorAll',
];

export const DEFAULT_BEAUTIFY_OPTIONS: HTMLBeautifyOptions = {
	end_with_newline: true,
	eol: '\n',
	indent_with_tabs: true,
	indent_size: 4,
	wrap_line_length: 0,
	indent_inner_html: true,
	max_preserve_newlines: 0,
	preserve_newlines: false,
	extra_liners: [],
};
