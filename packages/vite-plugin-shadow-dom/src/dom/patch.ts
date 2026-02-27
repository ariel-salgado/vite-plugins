import { DOCUMENT_METHODS_TO_PATCH } from '../constants';

/**
 * Generates the document-patching snippet injected into the bootstrap script.
 *
 * Iterates over the query methods that ShadowRoot implements, replacing each
 * on `document` with a version that searches the shadow root first and falls
 * back to the original document method when nothing is found in the shadow.
 *
 * Adding support for a new method is a one-line change to PATCHED_METHODS.
 */
export function build_document_patch(global_name: string): string {
	return `
		const __shadow = window['${global_name}'];

		for (const m of ${JSON.stringify(DOCUMENT_METHODS_TO_PATCH)}) {
			const orig = document[m].bind(document);
			document[m] = (...args) => {
				const r = __shadow[m](...args);
				return r != null && (!('length' in r) || r.length > 0)
				? r
				: orig(...args);
			};
		}
  `.trim();
}
