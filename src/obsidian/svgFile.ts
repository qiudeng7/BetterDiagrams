import { App, TFile } from 'obsidian';

export function resolveSvgFile(app: App, svgPath: string, sourcePath = ''): TFile | null {
	const directFile = app.vault.getAbstractFileByPath(svgPath);

	if (directFile instanceof TFile) {
		return directFile;
	}

	const linkedFile = app.metadataCache.getFirstLinkpathDest(svgPath, sourcePath);

	return linkedFile instanceof TFile ? linkedFile : null;
}

export function getVaultBasePath(app: App): string | undefined {
	const adapter = app.vault.adapter as { getBasePath?: () => string };

	return typeof adapter.getBasePath === 'function' ? adapter.getBasePath() : undefined;
}
