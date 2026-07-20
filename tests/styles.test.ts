import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

describe('overlay styles', () => {
	test('makes the overlay toolbar draggable while keeping buttons clickable', () => {
		expect(styles).toMatch(
			/\.better-diagram-toolbar\s*\{[\s\S]*-webkit-app-region:\s*drag;/,
		);
		expect(styles).toMatch(
			/\.better-diagram-toolbar\s+button\s*\{[\s\S]*-webkit-app-region:\s*no-drag;/,
		);
	});
});
