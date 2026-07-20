import { embedDiagramMetadata } from '../svg/metadata';

export const TLDRAW_PROJECT_FORMAT = 'tldraw-snapshot';

export function createTldrawDiagramFilename(date = new Date()): string {
	const year = date.getFullYear();
	const month = pad2(date.getMonth() + 1);
	const day = pad2(date.getDate());
	const hour = pad2(date.getHours());
	const minute = pad2(date.getMinutes());
	const second = pad2(date.getSeconds());

	return `tldraw-${year}${month}${day}-${hour}${minute}${second}.svg`;
}

export function createInitialTldrawSvg(): string {
	return embedDiagramMetadata(createEmptyTldrawSvg(), {
		schemaVersion: 1,
		editor: 'tldraw',
		project: { format: TLDRAW_PROJECT_FORMAT, data: '{}' },
	});
}

export function createEmptyTldrawSvg(): string {
	return [
		'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
		'<rect x="0.5" y="0.5" width="639" height="359" rx="12" fill="white" stroke="#9ca3af" stroke-dasharray="10 8"/>',
		'<text x="320" y="180" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24" fill="#6b7280">New tldraw diagram</text>',
		'</svg>',
	].join('');
}

export function parseTldrawSnapshot(data: string): Record<string, unknown> | null {
	try {
		const value: unknown = JSON.parse(data);
		return value && typeof value === 'object' && !Array.isArray(value)
			? (value as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function pad2(value: number): string {
	return value.toString().padStart(2, '0');
}
