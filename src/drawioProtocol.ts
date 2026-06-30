import type { DiagramMetadata } from './svgMetadata';

export const DRAWIO_EMBED_ORIGIN = 'https://embed.diagrams.net';

export interface DrawioMessage {
	event?: string;
	action?: string;
	xml?: string;
	data?: string;
	format?: string;
	exit?: boolean;
	modified?: boolean;
	[key: string]: unknown;
}

export function createDrawioEmbedUrl(): string {
	const params = new URLSearchParams({
		embed: '1',
		proto: 'json',
		spin: '1',
		libraries: '1',
		saveAndExit: '1',
		noExitBtn: '1',
	});

	return `${DRAWIO_EMBED_ORIGIN}/?${params.toString()}`;
}

export function createBlankDrawioXml(): string {
	return '<mxfile host="CommonMarkdownDiagramEditor"><diagram name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';
}

export function parseDrawioMessage(data: unknown): DrawioMessage | null {
	if (typeof data === 'string') {
		try {
			return parseDrawioMessage(JSON.parse(data));
		} catch {
			return null;
		}
	}

	if (!data || typeof data !== 'object') {
		return null;
	}

	const message = data as DrawioMessage;

	if (typeof message.event !== 'string' && typeof message.action !== 'string') {
		return null;
	}

	return message;
}

export function getDrawioXmlFromMetadata(metadata: DiagramMetadata | null): string | null {
	if (
		metadata?.editor !== 'drawio' ||
		metadata.project.format !== 'drawio-mxfile' ||
		!metadata.project.data
	) {
		return null;
	}

	return metadata.project.data;
}

export function decodeDrawioSvgData(data: string): string {
	if (!data.startsWith('data:')) {
		return data;
	}

	const commaIndex = data.indexOf(',');

	if (commaIndex === -1) {
		return data;
	}

	const metadata = data.slice(0, commaIndex);
	const payload = data.slice(commaIndex + 1);

	if (metadata.endsWith(';base64')) {
		return decodeBase64Utf8(payload);
	}

	return decodeURIComponent(payload);
}

function decodeBase64Utf8(value: string): string {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return new TextDecoder().decode(bytes);
}
