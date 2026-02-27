import { afterEach, describe, expect, it } from 'vitest';
import { build_document_patch } from '../../src/dom/patch.js';

const GLOBAL = '__testShadow';

const orig_get_by_id = document.getElementById.bind(document);
const orig_query = document.querySelector.bind(document);
const orig_query_all = document.querySelectorAll.bind(document);

function restore_document() {
	document.getElementById = orig_get_by_id;
	document.querySelector = orig_query;
	document.querySelectorAll = orig_query_all;
}

function apply_patch() {
	// eslint-disable-next-line no-eval
	eval(build_document_patch(GLOBAL));
}

interface ShadowFixture {
	host: HTMLElement;
	outside: HTMLElement;
	shadow: ShadowRoot;
	cleanup: () => void;
}

function create_shadow(mode: 'open' | 'closed' = 'closed'): ShadowFixture {
	const outside = document.createElement('div');
	outside.id = 'outside';
	outside.textContent = 'outside content';

	const host = document.createElement('div');
	host.id = 'test-host';

	document.body.append(outside, host);

	const shadow = host.attachShadow({ mode, delegatesFocus: true, serializable: true });

	const app = document.createElement('div');
	app.id = 'app';
	app.innerHTML = `
		<p id="content">hello shadow</p>
		<input id="name-input" type="text" />
		<button id="btn">click</button>
  	`;
	shadow.appendChild(app);

	(window as any)[GLOBAL] = shadow;

	return {
		host,
		outside,
		shadow,
		cleanup() {
			host.remove();
			outside.remove();
			delete (window as any)[GLOBAL];
		},
	};
}

afterEach(() => {
	restore_document();
	orig_get_by_id('test-host')?.remove();
	orig_get_by_id('outside')?.remove();
	delete (window as any)[GLOBAL];
});

describe('shadow root global', () => {
	it('exposes a real ShadowRoot on window', () => {
		const { cleanup } = create_shadow();
		expect((window as any)[GLOBAL]).toBeInstanceOf(ShadowRoot);
		cleanup();
	});

	it('works for both open and closed modes', () => {
		for (const mode of ['open', 'closed'] as const) {
			const { cleanup } = create_shadow(mode);
			expect((window as any)[GLOBAL]).toBeInstanceOf(ShadowRoot);
			cleanup();
			restore_document();
		}
	});
});

describe('shadow mode', () => {
	it('open: host.shadowRoot is accessible', () => {
		const { host, cleanup } = create_shadow('open');
		expect(host.shadowRoot).toBeInstanceOf(ShadowRoot);
		cleanup();
	});

	it('closed: host.shadowRoot returns null', () => {
		const { host, cleanup } = create_shadow('closed');
		expect(host.shadowRoot).toBeNull();
		cleanup();
	});
});

describe('document.getElementById', () => {
	it('finds elements inside the shadow root', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.getElementById('content')?.textContent).toBe('hello shadow');
		cleanup();
	});

	it('falls back to regular document when id not in shadow', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.getElementById('outside')?.textContent).toBe('outside content');
		cleanup();
	});

	it('returns null when id exists nowhere', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.getElementById('nonexistent')).toBeNull();
		cleanup();
	});
});

describe('document.querySelector', () => {
	it('finds elements inside the shadow root', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.querySelector('#content')?.textContent).toBe('hello shadow');
		cleanup();
	});

	it('falls back to regular document when selector not in shadow', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.querySelector('#outside')?.textContent).toBe('outside content');
		cleanup();
	});

	it('supports complex selectors', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.querySelector('#app p#content')).not.toBeNull();
		cleanup();
	});

	it('returns null when selector matches nothing', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.querySelector('.nonexistent')).toBeNull();
		cleanup();
	});

	it('allows mutating shadow elements via the returned reference', () => {
		const { shadow, cleanup } = create_shadow();
		apply_patch();
		(document.querySelector('#content') as HTMLElement).textContent = 'mutated';
		expect(shadow.getElementById('content')?.textContent).toBe('mutated');
		cleanup();
	});
});

describe('document.querySelectorAll', () => {
	it('finds multiple elements inside the shadow root', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.querySelectorAll('#app *').length).toBeGreaterThan(0);
		cleanup();
	});

	it('falls back to regular document when shadow has no matches', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		const results = document.querySelectorAll('#outside');
		expect(results.length).toBe(1);
		cleanup();
	});

	it('returns empty NodeList when nothing matches anywhere', () => {
		const { cleanup } = create_shadow();
		apply_patch();
		expect(document.querySelectorAll('.nonexistent').length).toBe(0);
		cleanup();
	});
});

describe('without patching', () => {
	it('document.querySelector cannot pierce shadow boundary', () => {
		const { cleanup } = create_shadow('closed');
		expect(orig_query('#content')).toBeNull();
		cleanup();
	});

	it('document.getElementById cannot pierce shadow boundary', () => {
		const { cleanup } = create_shadow('closed');
		expect(orig_get_by_id('content')).toBeNull();
		cleanup();
	});
});

describe('delegatesFocus', () => {
	it('focuses the first focusable shadow element when host is focused', async () => {
		const { host, shadow, cleanup } = create_shadow();
		apply_patch();
		host.tabIndex = 0;
		host.focus();

		await new Promise(r => requestAnimationFrame(r));

		expect(shadow.activeElement?.id).toBe('name-input');

		cleanup();
	});
});
