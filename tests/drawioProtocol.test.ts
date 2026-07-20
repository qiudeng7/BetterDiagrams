import { describe, expect, test } from 'vitest';
import {
	createBlankDrawioXml,
	createDrawioEmbedUrl,
	decodeDrawioSvgData,
	getDrawioXmlFromMetadata,
	parseDrawioMessage,
} from '../src/drawio/protocol';

describe('drawio protocol helpers', () => {
	test('creates an embed url that uses draw.io json postMessage protocol', () => {
		const url = createDrawioEmbedUrl();

		expect(url).toContain('https://embed.diagrams.net/');
		expect(url).toContain('embed=1');
		expect(url).toContain('proto=json');
	});

	test('parses draw.io json protocol messages', () => {
		expect(parseDrawioMessage('{"event":"init"}')).toEqual({ event: 'init' });
		expect(parseDrawioMessage({ event: 'save', xml: '<mxfile />' })).toEqual({
			event: 'save',
			xml: '<mxfile />',
		});
		expect(parseDrawioMessage('not json')).toBeNull();
	});

	test('extracts draw.io xml only from draw.io metadata', () => {
		expect(
			getDrawioXmlFromMetadata({
				schemaVersion: 1,
				editor: 'drawio',
				project: { format: 'drawio-mxfile', data: '<mxfile>saved</mxfile>' },
			}),
		).toBe('<mxfile>saved</mxfile>');
		expect(
			getDrawioXmlFromMetadata({
				schemaVersion: 1,
				editor: 'tldraw',
				project: { format: 'tldraw-snapshot', data: '{}' },
			}),
		).toBeNull();
	});

	test('creates blank draw.io xml when an svg has no project metadata', () => {
		const xml = createBlankDrawioXml();

		expect(xml).toContain('<mxfile');
		expect(xml).toContain('<mxGraphModel');
		expect(xml).toContain('<root>');
	});

	test('decodes draw.io svg data uris', () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect /></svg>';
		const data = `data:image/svg+xml,${encodeURIComponent(svg)}`;

		expect(decodeDrawioSvgData(data)).toBe(svg);
		expect(decodeDrawioSvgData(svg)).toBe(svg);
	});
});
