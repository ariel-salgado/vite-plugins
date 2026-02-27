import { describe, expect, it } from 'vitest';
import { format_html } from '../../src/process/format.js';
import { read_fixture } from '../helpers.js';

describe('format_html', () => {
	it('expands a minified single-line fixture into multi-line output', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		expect(input.trim().split('\n')).toHaveLength(1);
		expect(result.trim().split('\n').length).toBeGreaterThan(10);
	});

	it('output contains all original structural elements', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		expect(result).toContain('<html');
		expect(result).toContain('<head>');
		expect(result).toContain('<body>');
		expect(result).toContain('id="shadow-host"');
		expect(result).toContain('id="shadow-template"');
		expect(result).toContain('id="app"');
		expect(result).toContain('<script type="module">');
	});

	it('output is indented with tabs', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		const tab_indented_lines = result.split('\n').filter(line => line.startsWith('\t'));
		expect(tab_indented_lines.length).toBeGreaterThan(0);
	});

	it('output ends with a newline', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		expect(result.endsWith('\n')).toBe(true);
	});

	it('preserves script content — does not mangle inline JS', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		expect(result).toContain('attachShadow(');
		expect(result).toContain('window[\'__shadowRoot\']');
		expect(result).toContain('tpl.content.cloneNode(true)');
		expect(result).toContain('import(\'/assets/index.js\')');
	});

	it('preserves CSS href and JS import values exactly', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		expect(result).toContain('link.href = \'/assets/index.css\'');
		expect(result).toContain('import(\'/assets/index.js\')');
	});

	it('accepts custom js-beautify options that override defaults', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input, { indent_with_tabs: false, indent_size: 2 });

		const space_indented_lines = result.split('\n').filter(line => line.startsWith('  '));
		const tab_indented_lines = result.split('\n').filter(line => line.startsWith('\t'));

		expect(space_indented_lines.length).toBeGreaterThan(0);
		expect(tab_indented_lines.length).toBe(0);
	});

	it('does not add extra blank lines between tags', () => {
		const input = read_fixture('unformatted.html');
		const result = format_html(input);

		expect(result).not.toMatch(/\n\s*\n\s*\n/);
	});
});
