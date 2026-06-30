import { describe, expect, test } from 'vitest';
import {
	embedDiagramMetadata,
	extractDiagramMetadata,
} from '../src/svgMetadata';

describe('svg diagram metadata', () => {
	test('round-trips project metadata without changing renderable svg content', () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>';
		const metadata = {
			schemaVersion: 1,
			editor: 'drawio',
			project: {
				format: 'drawio-mxfile',
				data: '<mxfile>hello</mxfile>',
			},
		} as const;

		const updated = embedDiagramMetadata(svg, metadata);

		expect(updated).toContain('<rect width="10" height="10" />');
		expect(extractDiagramMetadata(updated)).toEqual(metadata);
	});

	test('replaces existing common markdown diagram metadata', () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5" /></svg>';
		const first = embedDiagramMetadata(svg, {
			schemaVersion: 1,
			editor: 'drawio',
			project: {
				format: 'drawio-mxfile',
				data: '<mxfile>old</mxfile>',
			},
		});

		const updated = embedDiagramMetadata(first, {
			schemaVersion: 1,
			editor: 'tldraw',
			project: {
				format: 'tldraw-snapshot',
				data: '{"document":{}}',
			},
		});

		expect(updated.match(/common-markdown-diagram-editor/g)).toHaveLength(1);
		expect(extractDiagramMetadata(updated)).toEqual({
			schemaVersion: 1,
			editor: 'tldraw',
			project: {
				format: 'tldraw-snapshot',
				data: '{"document":{}}',
			},
		});
	});

	test('ignores metadata without project data', () => {
		const encoded = btoa(JSON.stringify({ schemaVersion: 1, editor: 'drawio' }));
		const broken = `<svg><metadata data-common-markdown-diagram-editor="${encoded}"></metadata></svg>`;

		expect(extractDiagramMetadata(broken)).toBeNull();
	});

	test('returns null when svg has no common markdown diagram metadata', () => {
		expect(extractDiagramMetadata('<svg><metadata>other</metadata></svg>')).toBeNull();
	});
});
