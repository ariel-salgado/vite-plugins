import { DOCUMENT_METHODS_TO_PATCH } from '../constants';

/**
 * Generates the document-patching snippet injected into the bootstrap script.
 *
 * Iterates over the query methods that ShadowRoot implements, replacing each
 * on `document` with a version that searches the shadow root first and falls
 * back to the original document method when nothing is found in the shadow.
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

/**
 * Generates a MutationObserver snippet that clones any <style> tag added
 * to document.head into the shadow root.
 *
 * This is required in dev mode where Vite injects CSS as runtime <style>
 * elements rather than emitting <link> tags. Without this, styles from
 * `import './style.css'` in the app entry never reach the shadow tree.
 *
 * Safe to include in production too — no <style> tags are injected there
 * so the observer fires zero times and has no cost.
 */
export function build_style_observer(global_name: string): string {
	return `
		const __style_target = window['${global_name}'];
		const __existing_styles = document.head.querySelectorAll('style');

		for (const s of __existing_styles) {
			__style_target.appendChild(s.cloneNode(true));
		}

		new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node.nodeName === 'STYLE') {
						__style_target.appendChild(node.cloneNode(true));
					}
				}
			}
		}).observe(document.head, { childList: true });
	`.trim();
}
