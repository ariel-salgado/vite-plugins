import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function read_fixture(name: string): string {
	return readFileSync(resolve(__dirname, './fixtures', name), 'utf-8');
}
