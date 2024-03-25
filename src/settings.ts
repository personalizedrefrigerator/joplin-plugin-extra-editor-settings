import joplin from "api";
import { SettingItem, SettingItemType, SettingStorage } from "api/types";
import { PluginSettings } from "./types";

export const registerSettings = async (applySettings: (settings: PluginSettings)=>void) => {
	const sectionName = 'codemirror6-extended-options';
	await joplin.settings.registerSection(sectionName, {
		label: 'Extra editor settings',
		description: 'Additional settings for Joplin\'s beta and mobile markdown editors.',
		iconName: 'fas fa-edit',
	});

	const defaultSettingOptions = {
		section: sectionName,
		public: true,
		type: SettingItemType.Bool,
		storage: SettingStorage.File,
	};

	const settingsSpec: Record<keyof PluginSettings, SettingItem> = {
		lineNumbers: {
			...defaultSettingOptions,
			value: true,
			label: 'Show line numbers',
		},
		codeFolding: {
			...defaultSettingOptions,
			value: false,
			label: 'Enable code folding',
		},
		enableAutocomplete: {
			...defaultSettingOptions,
			value: false,
			label: 'Enable autocomplete',
		},
		highlightActiveLineGutter: {
			...defaultSettingOptions,
			value: true,
			label: 'Highlight the gutter for the active line',
			description: 'Requires "show line numbers" to be enabled.',
		},
		highlightActiveLine: {
			...defaultSettingOptions,
			value: false,
			label: 'Highlight active line',
		},
		highlightSpaces: {
			...defaultSettingOptions,
			value: false,
			label: 'Highlight spaces',
		},
		highlightTrailingSpaces: {
			...defaultSettingOptions,
			value: false,
			label: 'Highlight trailing spaces',
		},
	};

	const readSettings = async () => {
		const result: Record<string, any> = {};
		for (const key in settingsSpec) {
			result[key] = (await joplin.settings.value(key)) ?? true;
		}
		return result as PluginSettings;
	};
	await joplin.settings.registerSettings(settingsSpec);
	await joplin.settings.onChange(async () => {
		applySettings(await readSettings());
	});

	const settings = await readSettings();
	applySettings(settings);
	return settings;
};