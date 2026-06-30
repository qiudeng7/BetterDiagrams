import { describe, expect, test } from 'vitest';
import { normalizeSvgPath } from '../src/svgPath';

describe('normalizeSvgPath', () => {
	test('keeps vault-relative svg paths', () => {
		expect(normalizeSvgPath('Diagrams/example.svg')).toBe('Diagrams/example.svg');
	});

	test('removes query strings and hash fragments from svg resource paths', () => {
		expect(normalizeSvgPath('Diagrams/example.svg?mtime=1#preview')).toBe('Diagrams/example.svg');
	});

	test('decodes url-encoded svg paths', () => {
		expect(normalizeSvgPath('Diagrams/my%20diagram.svg')).toBe('Diagrams/my diagram.svg');
	});

	test('ignores non-svg paths', () => {
		expect(normalizeSvgPath('Diagrams/example.png')).toBeNull();
		expect(normalizeSvgPath('')).toBeNull();
		expect(normalizeSvgPath(null)).toBeNull();
	});
});
