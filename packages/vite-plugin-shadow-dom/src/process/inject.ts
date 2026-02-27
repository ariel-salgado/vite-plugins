import type { ResolvedOptions } from '../types.js';

import { build_document_patch, build_style_observer } from '../dom/patch.js';

export function build_bootstrap_script(
	css_hrefs: string[],
	js_srcs: string[],
	opts: ResolvedOptions,
): string {
	const css_block = css_hrefs.length > 0
		? opts.cssStrategy === 'constructable'
			? build_constructable_css(css_hrefs)
			: build_link_css(css_hrefs)
		: '';

	const js_block = js_srcs.map(src => `  import('${src}');`).join('\n');
	const patch_block = opts.patchDocument ? build_document_patch(opts.shadowRootGlobal) : '';
	const style_observer = build_style_observer(opts.shadowRootGlobal);

	return `
		<script type="module">
			const host = document.getElementById('${opts.hostId}');

			const shadow = host.attachShadow({
			  mode: '${opts.mode}',
			  delegatesFocus: ${opts.delegatesFocus},
			  serializable: ${opts.serializable},
			});

			const tpl = document.getElementById('${opts.templateId}');

			shadow.appendChild(tpl.content.cloneNode(true));

			window['${opts.shadowRootGlobal}'] = shadow;

			${patch_block}
			${style_observer}
			${css_block}
			${js_block}
		</script>
	`;
}

function build_link_css(hrefs: string[]): string {
	return hrefs.map(href => `
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '${href}';
		shadow.appendChild(link);
	`).join('\n');
}

function build_constructable_css(hrefs: string[]): string {
	const fetches = hrefs.map((href, i) => `
		const res_${i} = await fetch('${href}');
		const sheet_${i} = new CSSStyleSheet();
		await sheet_${i}.replace(await res_${i}.text());
	`).join('\n');

	const sheet_refs = hrefs.map((_, i) => `sheet_${i}`).join(', ');

	return `
		(async () => {
			${fetches}
			shadow.adoptedStyleSheets = [${sheet_refs}];
		})();
	`;
}
