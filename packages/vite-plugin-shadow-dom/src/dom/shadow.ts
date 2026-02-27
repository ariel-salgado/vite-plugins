/**
 * Client-side helper for apps running inside a shadow DOM.
 *
 * When the shadow root mode is 'closed', element.shadowRoot returns null
 * and document.getElementById / querySelector cannot find shadow DOM elements.
 * Use getShadowRoot() as your document substitute to query the shadow tree.
 */
export function getShadowRoot(globalName = '__shadowRoot'): ShadowRoot | Document {
	if (typeof window === 'undefined')
		return {} as Document;

	return ((window as unknown as Record<string, unknown>)[globalName] as ShadowRoot | undefined) ?? document;
}
