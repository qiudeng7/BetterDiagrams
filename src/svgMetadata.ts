export interface DiagramMetadata {
	schemaVersion: 1;
	editor: string;
	project: DiagramProject;
}

export interface DiagramProject {
	format: string;
	data: string;
}

const METADATA_ATTRIBUTE = 'data-common-markdown-diagram-editor';
const EXISTING_METADATA_PATTERN =
	/<metadata\b[^>]*\bdata-common-markdown-diagram-editor="[^"]*"[^>]*(?:\/>|>[\s\S]*?<\/metadata>)\s*/gi;
const METADATA_PATTERN =
	/<metadata\b[^>]*\bdata-common-markdown-diagram-editor="([^"]+)"[^>]*(?:\/>|>[\s\S]*?<\/metadata>)/i;
const SVG_OPEN_TAG_PATTERN = /<svg\b[^>]*>/i;

export function embedDiagramMetadata(svg: string, metadata: DiagramMetadata): string {
	const cleanedSvg = svg.replace(EXISTING_METADATA_PATTERN, '');
	const openTagMatch = SVG_OPEN_TAG_PATTERN.exec(cleanedSvg);

	if (!openTagMatch) {
		throw new Error('Cannot embed diagram metadata into content without an <svg> root.');
	}

	const [openTag] = openTagMatch;
	const insertAt = openTagMatch.index + openTag.length;
	const encodedMetadata = encodeBase64Utf8(JSON.stringify(metadata));
	const metadataElement = `<metadata ${METADATA_ATTRIBUTE}="${encodedMetadata}"></metadata>`;

	return `${cleanedSvg.slice(0, insertAt)}${metadataElement}${cleanedSvg.slice(insertAt)}`;
}

export function extractDiagramMetadata(svg: string): DiagramMetadata | null {
	const match = METADATA_PATTERN.exec(svg);
	const encodedMetadata = match?.[1];

	if (!encodedMetadata) {
		return null;
	}

	try {
		const value: unknown = JSON.parse(decodeBase64Utf8(encodedMetadata));

		if (isDiagramMetadata(value)) {
			return value;
		}
	} catch {
		return null;
	}

	return null;
}

function isDiagramMetadata(value: unknown): value is DiagramMetadata {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const metadata = value as Partial<DiagramMetadata>;
	const project = metadata.project as Partial<DiagramProject> | undefined;

	return (
		metadata.schemaVersion === 1 &&
		typeof metadata.editor === 'string' &&
		!!project &&
		typeof project === 'object' &&
		typeof project.format === 'string' &&
		typeof project.data === 'string'
	);
}

function encodeBase64Utf8(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = '';

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary);
}

function decodeBase64Utf8(value: string): string {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return new TextDecoder().decode(bytes);
}
