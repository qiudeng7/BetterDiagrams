import { describe, expect, test } from 'vitest';
import {
	createInitialTldrawSvg,
	createTldrawDiagramFilename,
	parseTldrawSnapshot,
	TLDRAW_PROJECT_FORMAT,
} from '../src/tldraw/diagram';
import { extractDiagramMetadata } from '../src/svg/metadata';

describe('tldraw diagram helpers', () => {
	test('creates deterministic tldraw svg filenames', () => {
		expect(createTldrawDiagramFilename(new Date('2026-06-30T22:15:04'))).toBe(
			'tldraw-20260630-221504.svg',
		);
	});

	test('creates a blank svg with editable tldraw project metadata', () => {
		const metadata = extractDiagramMetadata(createInitialTldrawSvg());

		expect(metadata).toEqual({
			schemaVersion: 1,
			editor: 'tldraw',
			project: { format: TLDRAW_PROJECT_FORMAT, data: '{}' },
		});
	});

	test('accepts object snapshots and rejects invalid snapshots', () => {
		expect(parseTldrawSnapshot('{"document":{}}')).toEqual({ document: {} });
		expect(parseTldrawSnapshot('[]')).toBeNull();
		expect(parseTldrawSnapshot('invalid')).toBeNull();
	});
});
