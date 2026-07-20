import { App, TFile } from 'obsidian';

export function resolveSvgFile(app: App, svgPath: string): TFile | null {
	const directFile = app.vault.getAbstractFileByPath(svgPath);

	if (directFile instanceof TFile) {
		return directFile;
	}

	const activeFile = app.workspace.getActiveFile();
	const linkedFile = app.metadataCache.getFirstLinkpathDest(svgPath, activeFile?.path ?? '');

	return linkedFile instanceof TFile ? linkedFile : null;
}

export function getVaultBasePath(app: App): string | undefined {
	const adapter = app.vault.adapter as { getBasePath?: () => string };

	return typeof adapter.getBasePath === 'function' ? adapter.getBasePath() : undefined;
}
