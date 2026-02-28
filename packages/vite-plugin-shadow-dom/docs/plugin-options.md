# Options

All options are optional. The plugin works with a sensible set of defaults out of the box.

```typescript
shadowDOM({
	// all options and their defaults shown below
});
```

---

## `mode`

**Type:** `'open' | 'closed'`
**Default:** `'open'`

Controls whether the shadow root is accessible from JavaScript outside the shadow tree.

With `'open'`, any code on the page can reach inside via `element.shadowRoot`. This is the right default for most use cases — it keeps DevTools inspection working normally and lets you access the shadow tree programmatically when needed.

With `'closed'`, `element.shadowRoot` returns `null` from outside. This is a harder boundary, but it is not a security mechanism — determined code can still intercept `attachShadow`. Use it when you want to make accidental external access fail loudly rather than silently. In either mode, the shadow root is always accessible via `window[shadowRootGlobal]` since the plugin sets that property before importing your app's JS.

---

## `cssStrategy`

**Type:** `'link' | 'constructable'`
**Default:** `'link'`

Controls how built CSS files are injected into the shadow root.

With `'link'`, a `<link rel="stylesheet">` element is created and appended to the shadow root. This is the simplest approach and works everywhere, but there may be a brief flash of unstyled content while the stylesheet fetches.

With `'constructable'`, the stylesheet is fetched as text and loaded via the `CSSStyleSheet` constructor and `adoptedStyleSheets`. This eliminates the flash of unstyled content and is composable if you end up with multiple stylesheets, but it requires an async fetch after the shadow root is attached.

---

## `appId`

**Type:** `string`
**Default:** `'app'`

The `id` attribute of the element to isolate into the shadow DOM. The plugin finds this element in the body, wraps it in a `<template>`, and replaces it in place with the shadow host. Everything else in `<body>` stays in the regular document untouched.

If no element with the given id is found, the plugin leaves the page completely unchanged rather than failing.

---

## `hostId`

**Type:** `string`
**Default:** `'shadow-host'`

The `id` given to the `<div>` that becomes the shadow host. The host is placed exactly where the original `appId` element was in the document.

---

## `templateId`

**Type:** `string`
**Default:** `'shadow-template'`

The `id` given to the `<template>` element that holds the original content before it is stamped into the shadow root.

---

## `delegatesFocus`

**Type:** `boolean`
**Default:** `true`

When `true`, clicking anywhere on the shadow host element forwards focus to the first focusable element inside the shadow root. This makes keyboard navigation and focus management work naturally without requiring any extra handling in your code. Recommended whenever the shadow content contains inputs, buttons, or any other interactive elements.

---

## `serializable`

**Type:** `boolean`
**Default:** `true`

When `true`, the shadow root can be serialized via `getHTML()` and is fully inspectable in browser DevTools. Disable this only if you have a specific reason to prevent shadow root serialization.

---

## `patchDocument`

**Type:** `boolean`
**Default:** `true`

When `true`, the bootstrap script patches `document.getElementById`, `document.querySelector`, and `document.querySelectorAll` so they search the shadow root first before falling back to the regular document.

This is what makes your existing app code work without modification. A call like `document.querySelector('#app')` that would normally return `null` — because `#app` is now inside the shadow tree — transparently finds it in the shadow root instead.

Set this to `false` only if you are managing shadow root access yourself and do not want the patch applied.

---

## `shadowRootGlobal`

**Type:** `string`
**Default:** `'__shadowRoot'`

The name of the `window` property the shadow root is assigned to before your app's JS is imported. This makes the shadow root accessible from your code regardless of whether `mode` is `'open'` or `'closed'`.

```typescript
// In your app code
const shadow = window.__shadowRoot;
```

Change this if `__shadowRoot` conflicts with something already on `window` in your environment.

---

## `exclude`

**Type:** `string[] | (filename: string) => boolean`
**Default:** `undefined` (all HTML files are processed)

Prevents the plugin from processing specific HTML files. Matched against the absolute file path.

When given an array of strings, any file whose path includes one of the strings is skipped:

```typescript
shadowDOM({
	exclude: ['ignored.html', 'partial.html'],
});
```

When given a function, files for which the function returns `true` are skipped:

```typescript
shadowDOM({
	exclude: filename => !filename.endsWith('index.html'),
});
```

---

## `formatOutput`

**Type:** `boolean | HTMLBeautifyOptions`
**Default:** `true`

When enabled, the final HTML output is formatted with [js-beautify](https://github.com/beautify-web/js-beautify) before it is written to disk.
This only runs during production builds — the dev server output is never formatted.

Set to `false` to use disable the formatting process:

```typescript
shadowDOM({
	formatOutput: false,
});
```

Pass a `js-beautify` options object to customise the output:

```typescript
shadowDOM({
	formatOutput: {
		indent_with_tabs: false,
		indent_size: 2,
	},
});
```
