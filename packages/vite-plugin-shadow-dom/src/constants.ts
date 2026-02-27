import type { ResolvedOptions } from './types';

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
};

export const DOCUMENT_METHODS_TO_PATCH = [
	'getElementById',
	'querySelector',
	'querySelectorAll',
];
