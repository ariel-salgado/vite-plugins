import type { Plugin } from 'vite';

/**
 * Options for the vite-plugin-file-router plugin.
 */
export interface FileRouterOptions {
	/**
	 * Directory to scan for .html files, relative to the project root.
	 * @default 'src/pages'
	 */
	dir?: string;

	/**
	 * What to include. Each entry can be:
	 *  - A glob string tested against the path relative to `dir`
	 *  - A RegExp tested against the path relative to `dir`
	 *
	 * A file is included if it matches ANY entry (OR logic).
	 *
	 * @default ['**\/*.html']
	 */
	include?: (string | RegExp)[];

	/**
	 * Glob pattern(s) to exclude from the scan.
	 * @default []
	 */
	exclude?: string[];

	/**
	 * Directory name (inside outDir) where bundled JS/CSS assets will be emitted.
	 * Uses a leading underscore to stay separate from page routes by convention.
	 * @default '_static'
	 */
	assetsDir?: string;

	/**
	 * When true, logs all discovered routes and moved files to the console.
	 * @default false
	 */
	verbose?: boolean;

	/**
	 * Absolute path to the project root.
	 * @default process.cwd()
	 */
	root?: string;
}

/**
 * Resolved (fully-filled) version of FileRouterOptions.
 * Internal use only.
 */
export interface ResolvedFileRouterOptions {
	dir: string;
	include: (string | RegExp)[];
	exclude: string[];
	assetsDir: string;
	verbose: boolean;
	root: string;
}

/**
 * A discovered HTML route entry.
 */
export interface RouteEntry {
	/** Human-readable entry key, e.g. "index" or "about/index" */
	name: string;
	/** Absolute path to the .html file */
	abs_path: string;
	/** Path relative to `dir`, used for RegExp matching and logging */
	rel_path: string;
}

export type FileRouterPlugin = Plugin;
