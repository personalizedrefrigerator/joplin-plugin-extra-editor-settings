import joplin from "api";
import { SettingItem, SettingItemType, SettingStorage } from "api/types";
import { PluginSettings } from "./types";
import localization from "./localization";

export const registerSettings = async (applySettings: (settings: PluginSettings)=>void) => {
	const sectionName = 'codemirror6-extended-options';
	await joplin.settings.registerSection(sectionName, {
		label: localization.settings__appName,
		description: localization.settings__description,
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
			label: localization.setting__showLineNumber,
		},
		codeFolding: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__enableCodeFolding,
		},
		enableAutocomplete: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__enableAutocomplete,
		},
		highlightActiveLineGutter: {
			...defaultSettingOptions,
			value: true,
			label: localization.setting__highlightLineGutter,
			description: localization.setting__highlightLineGutter__description,
		},
		highlightActiveLine: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__highlightActiveLine,
		},
		highlightSpaces: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__highlightSpaces,
		},
		highlightTrailingSpaces: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__highlightTrailingSpaces,
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