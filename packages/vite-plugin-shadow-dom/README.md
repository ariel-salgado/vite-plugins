# @ariel-salgado/vite-plugin-shadow-dom

A Vite plugin that wraps your app inside a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM), providing true style and DOM encapsulation with no changes to your application code.

> **Note:** This plugin is designed and tested for vanilla HTML, JavaScript, and TypeScript projects. Framework support has not been tested.

## Motivation

When embedding a Vite app inside a third-party page or a legacy document, the host page's styles inevitably bleed into your app — and yours leak out.
Shadow DOM is the platform's native solution to this problem. This plugin handles all the wiring so your app runs in a fully isolated shadow tree without you having to restructure anything.

## How it works

The plugin finds the element with `id="app"` in your HTML, moves it into a `<template>` tag, replaces it with a shadow host `<div>`, and injects a bootstrap `<script>` that attaches a shadow root and stamps the template into it at runtime.

Everything else in `<body>` — any headers, footers, or scripts outside `#app` — is left exactly where it is in the regular document.

Given this input:

```html
<body>
  <div id="app">
    <h1>Hello</h1>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
```

The plugin produces:

```html
<body>
  <div id="shadow-host" style="display:block;width:100%;height:100%"></div>

  <template id="shadow-template">
    <div id="app">
      <h1>Hello</h1>
    </div>
  </template>

  <script type="module">
    const host = document.getElementById('shadow-host');
    const shadow = host.attachShadow({ mode: 'open', delegatesFocus: true, serializable: true });

    const tpl = document.getElementById('shadow-template');
    shadow.appendChild(tpl.content.cloneNode(true));

    window['__shadowRoot'] = shadow;

    // Patch document query methods to search the shadow root first
    for (const m of ['getElementById', 'querySelector', 'querySelectorAll']) {
      const orig = document[m].bind(document);
      document[m] = (...args) => {
        const r = shadow[m](...args);
        return r != null && (!('length' in r) || r.length > 0) ? r : orig(...args);
      };
    }

    // Mirror dev-mode <style> injections into the shadow root
    new MutationObserver(mutations => {
      for (const { addedNodes } of mutations)
        for (const node of addedNodes)
          if (node.nodeName === 'STYLE') shadow.appendChild(node.cloneNode(true));
    }).observe(document.head, { childList: true });

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/index.css';
    shadow.appendChild(link);

    import('/assets/index.js');
  </script>
</body>
```

## Installation

```bash
# npm
npm install -D @ariel-salgado/vite-plugin-shadow-dom

# pnpm
pnpm add -D @ariel-salgado/vite-plugin-shadow-dom

# bun
bun add -D @ariel-salgado/vite-plugin-shadow-dom
```

**Requires Vite >= 7.0.0**

## Usage

```typescript
import { shadowDOM } from '@ariel-salgado/vite-plugin-shadow-dom';
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [shadowDOM()],
});
```

With options:

```typescript
import { shadowDOM } from '@ariel-salgado/vite-plugin-shadow-dom';

export default defineConfig({
	plugins: [
		shadowDOM({
			mode: 'closed',
			cssStrategy: 'constructable',
			formatOutput: false,
		}),
	],
});
```

See the [documentation](./docs/plugin-options.md) for a full description of every option.

## Dev mode

The plugin runs in both dev and production.
During development, Vite injects CSS as `<style>` elements directly into `document.head` at runtime rather than emitting `<link>` tags. The bootstrap script installs a `MutationObserver` on `document.head` that automatically clones any `<style>` tag into the shadow root as it appears, so hot module replacement and style updates work without any extra configuration.

## CSS scoping

Built CSS files are injected into the shadow root as `<link>` tags (or as `CSSStyleSheet` objects when `cssStrategy: 'constructable'` is set), so all your styles are scoped to the shadow tree. CSS files are also kept in `<head>`, which ensures document-level selectors like `:root` and `body` continue to work as expected.

## Closed mode

When `mode: 'closed'`, `element.shadowRoot` returns `null` from outside the shadow tree. The plugin exposes the shadow root on `window.__shadowRoot` before importing your app's JS so it is always accessible regardless of mode.

```typescript
// Access the shadow root directly if needed
const shadow = window.__shadowRoot;
const app = shadow.getElementById('app');
```

The window property name is configurable via the `shadowRootGlobal` option.
