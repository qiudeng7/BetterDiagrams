import { describe, expect, test } from 'vitest';
import {
	createDrawioDiagramFilename,
	createInitialDrawioSvg,
	createMarkdownImageEmbed,
} from '../src/drawio/diagram';
import { extractDiagramMetadata } from '../src/svg/metadata';

describe('diagram insertion helpers', () => {
	test('creates deterministic draw.io svg filenames', () => {
		expect(createDrawioDiagramFilename(new Date('2026-06-30T22:15:04'))).toBe(
			'drawio-20260630-221504.svg',
		);
	});

	test('creates a blank svg with editable draw.io project metadata', () => {
		const svg = createInitialDrawioSvg();
		const metadata = extractDiagramMetadata(svg);

		expect(svg).toContain('<svg');
		expect(svg).toContain('</svg>');
		expect(metadata).toEqual({
			schemaVersion: 1,
			editor: 'drawio',
			project: {
				format: 'drawio-mxfile',
				data: expect.stringContaining('<mxfile'),
			},
		});
	});

	test('turns Obsidian generated links into image embeds', () => {
		expect(createMarkdownImageEmbed('[[Diagrams/example.svg]]')).toBe('![[Diagrams/example.svg]]');
		expect(createMarkdownImageEmbed('[example](Diagrams/example.svg)')).toBe(
			'![example](Diagrams/example.svg)',
		);
	});
});
