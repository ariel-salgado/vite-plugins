import type { HTMLBeautifyOptions } from 'js-beautify';

export type ShadowMode = 'open' | 'closed';
export type CSSStrategy = 'link' | 'constructable';

export interface ShadowDOMOptions {
	/**
	 * Shadow root mode.
	 * 'closed' prevents external JS from accessing internals via element.shadowRoot.
	 * Your app should use getShadowRoot() from the client entry instead.
	 * @default 'open'
	 */
	mode?: ShadowMode;

	/**
	 * How Vite-built CSS is injected into the shadow root.
	 * 'constructable' avoids FOUC but requires an async fetch.
	 * @default 'link'
	 */
	cssStrategy?: CSSStrategy;

	/**
	 * id of the generated shadow host element.
	 * @default 'shadow-host'
	 */
	hostId?: string;

	/**
	 * id of the <template> holding original content.
	 * @default 'shadow-template'
	 */
	templateId?: string;

	/**
	 * Forwards focus events across the shadow boundary.
	 * Set true if the shadow content has inputs, buttons, or other focusable elements.
	 * @default true
	 */
	delegatesFocus?: boolean;

	/**
	 * Allows the shadow root to be serialized via getHTML() and inspected in DevTools.
	 * Disable only if you need strict serialization prevention.
	 * @default true
	 */
	serializable?: boolean;

	/**
	 * The id of the element inside <body> to isolate into the shadow DOM.
	 * Everything else in <body> stays in the regular document.
	 * @default 'app'
	 */
	appId?: string;

	/**
	 * HTML files to skip. Matched against the absolute file path.
	 * - string[]: skips files whose path includes any of the strings
	 * - function: skips files where the predicate returns true
	 */
	exclude?: string[] | ((filename: string) => boolean);

	/**
	 * Window property name used to expose the shadow root before JS is imported.
	 * Lets your app call getShadowRoot() to access shadow DOM elements,
	 * which is required when mode is 'closed'.
	 * @default '__shadowRoot'
	 */
	shadowRootGlobal?: string;

	/**
	 * Patches document.getElementById, document.querySelector, and
	 * document.querySelectorAll to search the shadow root first.
	 * This lets app code like document.querySelector('#app') work
	 * without any modification regardless of shadow mode.
	 * @default true
	 */
	patchDocument?: boolean;

	/**
	 * Fine-tune the js-beautify HTML formatter applied to the build output.
	 * Only takes effect during production builds, never in dev server.
	 * Set to false to disable formatting entirely.
	 * @default true (with sensible defaults)
	 */
	formatOutput?: boolean | HTMLBeautifyOptions;
}

export type ResolvedOptions = Omit<Required<ShadowDOMOptions>, 'formatOutput' | 'exclude'> & {
	formatOutput: false | HTMLBeautifyOptions;
	exclude: (filename: string) => boolean;
};

export interface ExtractedAssets {
	html: string;
	css_hrefs: string[];
	js_srcs: string[];
}

export interface BodySlice {
	before: string;
	content: string;
	after: string;
}

export interface ElementSlice {
	before: string;
	element: string;
	after: string;
}
