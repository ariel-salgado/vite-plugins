import type { ResolvedOptions } from '../../src/types.js';

import { describe, expect, it } from 'vitest';
import { DEFAULT_PLUGIN_OPTIONS } from '../../src/constants.js';
import { build_bootstrap_script } from '../../src/process/inject.js';

const base_opts = DEFAULT_PLUGIN_OPTIONS as ResolvedOptions;

describe('build_bootstrap_script', () => {
	it('produces attachShadow with all configured options', () => {
		const script = build_bootstrap_script([], [], base_opts);
		expect(script).toContain(`mode: 'open'`);
		expect(script).toContain('delegatesFocus: true');
		expect(script).toContain('serializable: true');
	});

	it('exposes shadow root on window before importing JS', () => {
		const script = build_bootstrap_script([], ['/a.js'], base_opts);
		const global_idx = script.indexOf('window[\'__shadowRoot\']');
		const import_idx = script.indexOf('import(\'/a.js\')');
		expect(global_idx).toBeGreaterThan(-1);
		expect(import_idx).toBeGreaterThan(-1);
		expect(global_idx).toBeLessThan(import_idx);
	});

	it('injects all CSS hrefs as link elements', () => {
		const script = build_bootstrap_script(['/a.css', '/b.css'], [], base_opts);
		expect(script).toContain('link.href = \'/a.css\'');
		expect(script).toContain('link.href = \'/b.css\'');
	});

	it('uses constructable stylesheets when strategy is constructable', () => {
		const opts = { ...base_opts, cssStrategy: 'constructable' as const };
		const script = build_bootstrap_script(['/a.css', '/b.css'], [], opts);
		expect(script).toContain('new CSSStyleSheet()');
		expect(script).toContain('adoptedStyleSheets');
		expect(script).toContain('fetch(\'/a.css\')');
		expect(script).toContain('fetch(\'/b.css\')');
		expect(script).not.toContain('createElement');
	});

	it('imports all JS srcs', () => {
		const script = build_bootstrap_script([], ['/a.js', '/b.js'], base_opts);
		expect(script).toContain('import(\'/a.js\')');
		expect(script).toContain('import(\'/b.js\')');
	});

	it('produces no injection blocks when lists are empty', () => {
		const script = build_bootstrap_script([], [], base_opts);
		expect(script).not.toContain('import(');
		expect(script).not.toContain('createElement');
		expect(script).not.toContain('CSSStyleSheet');
	});
});
