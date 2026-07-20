import { PluginSettingTab, Setting, type App } from 'obsidian';

export type DiagramRefreshStrategy = 'private-first' | 'private-only' | 'safe-only';

export interface BetterDiagramSettings {
	refreshStrategy: DiagramRefreshStrategy;
}

export const DEFAULT_SETTINGS: BetterDiagramSettings = {
	refreshStrategy: 'private-first',
};

interface SettingsHost {
	settings: BetterDiagramSettings;
	saveSettings(): Promise<void>;
}

export class BetterDiagramSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: SettingsHost) {
		super(app, plugin as never);
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.createEl('h3', { text: 'Advanced' });

		new Setting(this.containerEl)
			.setName('Live Preview refresh strategy')
			.setDesc('Controls how BetterDiagram rebuilds the current Markdown tab after saving a diagram.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('private-first', 'Private API first, then safe fallback')
					.addOption('private-only', 'Private API only')
					.addOption('safe-only', 'Safe API only')
					.setValue(this.plugin.settings.refreshStrategy)
					.onChange(async (value) => {
						if (!isRefreshStrategy(value)) {
							return;
						}

						this.plugin.settings.refreshStrategy = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}

function isRefreshStrategy(value: string): value is DiagramRefreshStrategy {
	return value === 'private-first' || value === 'private-only' || value === 'safe-only';
}
