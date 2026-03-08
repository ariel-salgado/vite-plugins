import { describe, expect, it } from 'vitest';
import { rewriteAssetPaths } from '../src/transform.js';

const ROOT = '/project';
const HTML_ABS = '/project/src/pages/index.html';

const rewrite = (html: string) => rewriteAssetPaths(html, HTML_ABS, ROOT);

describe('rewriteAssetPaths — single URL attributes', () => {
	it('rewrites script[src]', () => {
		expect(rewrite('<script type="module" src="../lib/main.ts"></script>'))
			.toBe('<script type="module" src="/src/lib/main.ts"></script>');
	});

	it('rewrites link[href]', () => {
		expect(rewrite('<link rel="stylesheet" href="../assets/style.css">'))
			.toBe('<link rel="stylesheet" href="/src/assets/style.css">');
	});

	it('rewrites img[src]', () => {
		expect(rewrite('<img src="../assets/logo.png" alt="logo">'))
			.toBe('<img src="/src/assets/logo.png" alt="logo">');
	});

	it('rewrites source[src]', () => {
		expect(rewrite('<source src="../video/clip.mp4">'))
			.toBe('<source src="/src/video/clip.mp4">');
	});

	it('rewrites video[src]', () => {
		expect(rewrite('<video src="../video/clip.mp4">'))
			.toBe('<video src="/src/video/clip.mp4">');
	});

	it('rewrites audio[src]', () => {
		expect(rewrite('<audio src="../audio/track.mp3">'))
			.toBe('<audio src="/src/audio/track.mp3">');
	});

	it('handles single-quoted attributes', () => {
		expect(rewrite('<script src=\'../lib/main.ts\'></script>'))
			.toBe('<script src=\'/src/lib/main.ts\'></script>');
	});

	it('rewrites multiple tags in one pass', () => {
		const input = `
      <link href="../assets/style.css">
      <script src="../lib/main.ts"></script>
      <img src="../assets/logo.png">
    `.trim();
		const result = rewrite(input);
		expect(result).toContain('href="/src/assets/style.css"');
		expect(result).toContain('src="/src/lib/main.ts"');
		expect(result).toContain('src="/src/assets/logo.png"');
	});
});

describe('rewriteAssetPaths — paths that must not be rewritten', () => {
	it('leaves root-relative paths untouched', () => {
		const html = '<script src="/src/lib/main.ts"></script>';
		expect(rewrite(html)).toBe(html);
	});

	it('leaves https:// URLs untouched', () => {
		const html = '<script src="https://cdn.example.com/lib.js"></script>';
		expect(rewrite(html)).toBe(html);
	});

	it('leaves http:// URLs untouched', () => {
		const html = '<script src="http://cdn.example.com/lib.js"></script>';
		expect(rewrite(html)).toBe(html);
	});

	it('leaves data: URIs untouched', () => {
		const html = '<img src="data:image/png;base64,abc123">';
		expect(rewrite(html)).toBe(html);
	});

	it('leaves mailto: hrefs untouched', () => {
		const html = '<link href="mailto:test@example.com">';
		expect(rewrite(html)).toBe(html);
	});

	it('leaves anchor hrefs untouched', () => {
		const html = '<link href="#section">';
		expect(rewrite(html)).toBe(html);
	});

	it('leaves protocol-relative URLs untouched', () => {
		const html = '<script src="//cdn.example.com/lib.js"></script>';
		expect(rewrite(html)).toBe(html);
	});
});

describe('rewriteAssetPaths — srcset', () => {
	it('rewrites img[srcset] with a single entry', () => {
		expect(rewrite('<img srcset="../img/hero.png 1x">'))
			.toBe('<img srcset="/src/img/hero.png 1x">');
	});

	it('rewrites img[srcset] with multiple entries and descriptors', () => {
		expect(rewrite('<img srcset="../img/hero.png 1x, ../img/hero@2x.png 2x">'))
			.toBe('<img srcset="/src/img/hero.png 1x, /src/img/hero@2x.png 2x">');
	});

	it('rewrites source[srcset]', () => {
		expect(rewrite('<source srcset="../img/hero.png 800w, ../img/hero-lg.png 1200w">'))
			.toBe('<source srcset="/src/img/hero.png 800w, /src/img/hero-lg.png 1200w">');
	});

	it('leaves absolute URLs in srcset untouched', () => {
		const html = '<img srcset="https://cdn.example.com/hero.png 1x">';
		expect(rewrite(html)).toBe(html);
	});

	it('handles mixed relative and absolute srcset entries', () => {
		expect(rewrite('<img srcset="../img/hero.png 1x, https://cdn.example.com/hero.png 2x">'))
			.toBe('<img srcset="/src/img/hero.png 1x, https://cdn.example.com/hero.png 2x">');
	});

	it('rewrites both src and srcset on the same img tag', () => {
		const input = '<img src="../img/hero.png" srcset="../img/hero.png 1x, ../img/hero@2x.png 2x">';
		const result = rewrite(input);
		expect(result).toContain('src="/src/img/hero.png"');
		expect(result).toContain('srcset="/src/img/hero.png 1x, /src/img/hero@2x.png 2x"');
	});
});

describe('rewriteAssetPaths — edge cases', () => {
	it('returns unchanged html when there are no rewriteable attributes', () => {
		const html = '<div class="foo"><p>Hello</p></div>';
		expect(rewrite(html)).toBe(html);
	});

	it('handles a page nested deeper in the pages dir', () => {
		const nested_html_abs = '/project/src/pages/admin/dashboard.html';
		const result = rewriteAssetPaths(
			'<script src="../../lib/main.ts"></script>',
			nested_html_abs,
			ROOT,
		);
		expect(result).toBe('<script src="/src/lib/main.ts"></script>');
	});

	it('handles same-directory relative path', () => {
		expect(rewrite('<script src="./local.ts"></script>'))
			.toBe('<script src="/src/pages/local.ts"></script>');
	});
});
