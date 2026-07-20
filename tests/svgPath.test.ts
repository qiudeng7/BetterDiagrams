import { describe, expect, test } from 'vitest';
import { normalizeSvgPath } from '../src/svg/path';

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

	test('converts app resource urls under the vault base path to vault-relative paths', () => {
		expect(
			normalizeSvgPath(
				'app://local/mnt/c/Users/qiudeng/Desktop/test-vault/Diagrams/my%20diagram.svg?mtime=1',
				'/mnt/c/Users/qiudeng/Desktop/test-vault',
			),
		).toBe('Diagrams/my diagram.svg');
	});

	test('converts windows absolute resource urls under the vault base path to vault-relative paths', () => {
		expect(
			normalizeSvgPath(
				'app://local/C:/Users/qiudeng/Desktop/test-vault/Diagrams/example.svg',
				'C:/Users/qiudeng/Desktop/test-vault',
			),
		).toBe('Diagrams/example.svg');
	});

	test('ignores non-svg paths', () => {
		expect(normalizeSvgPath('Diagrams/example.png')).toBeNull();
		expect(normalizeSvgPath('')).toBeNull();
		expect(normalizeSvgPath(null)).toBeNull();
	});
});
