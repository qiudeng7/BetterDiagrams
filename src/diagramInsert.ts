import { createBlankDrawioXml } from './drawioProtocol';
import { embedDiagramMetadata } from './svgMetadata';

export function createDrawioDiagramFilename(date = new Date()): string {
	const year = date.getFullYear();
	const month = pad2(date.getMonth() + 1);
	const day = pad2(date.getDate());
	const hour = pad2(date.getHours());
	const minute = pad2(date.getMinutes());
	const second = pad2(date.getSeconds());

	return `drawio-${year}${month}${day}-${hour}${minute}${second}.svg`;
}

export function createInitialDrawioSvg(): string {
	const svg = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
		'<rect x="0.5" y="0.5" width="639" height="359" rx="12" fill="white" stroke="#9ca3af" stroke-dasharray="10 8"/>',
		'<text x="320" y="180" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24" fill="#6b7280">New draw.io diagram</text>',
		'</svg>',
	].join('');

	return embedDiagramMetadata(svg, {
		schemaVersion: 1,
		editor: 'drawio',
		project: {
			format: 'drawio-mxfile',
			data: createBlankDrawioXml(),
		},
	});
}

export function createMarkdownImageEmbed(markdownLink: string): string {
	return markdownLink.startsWith('!') ? markdownLink : `!${markdownLink}`;
}

function pad2(value: number): string {
	return value.toString().padStart(2, '0');
}
