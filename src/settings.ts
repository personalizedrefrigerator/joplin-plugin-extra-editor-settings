import joplin from "api";
import { SettingItem, SettingItemType, SettingStorage } from "api/types";
import { HideMarkdownMode, PluginSettings, SyncIndicatorMode, TextDirection } from "./types";
import localization from "./localization";
import { isMobile } from "./utils/isMobile";

export const registerSettings = async (applySettings: (settings: PluginSettings)=>void) => {
	const sectionName = 'codemirror6-extended-options';
	await joplin.settings.registerSection(sectionName, {
		label: localization.settings__appName,
		description: localization.settings__description,
		iconName: 'fas fa-edit',
	});
	const onMobile = await isMobile();

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
		highlightSelectionMatches: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__highlightSelectionMatches,
		},
		bracketMatching: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__bracketMatching,
		},
		editorMaximumWidth: {
			...defaultSettingOptions,
			public: onMobile,

			value: 'none',

			options: {
				['none']: localization.setting__editorMaximumWidth__none,
				['300px']: '300 (small)',
				['400px']: '400',
				['500px']: '500',
				['600px']: '600',
				['800px']: '800',
				['1000px']: '1000',
				['1500px']: '1500 (large)',
			},

			type: SettingItemType.String,
			isEnum: true,
			label: localization.setting__editorMaximumWidth,
			description: localization.setting__editorMaximumWidth__description,
		},
		gridPattern: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__showGridPattern,
		},
		wordCount: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__showWordCount,
		},
		syncIndicator: {
			...defaultSettingOptions,
			type: SettingItemType.String,
			value: SyncIndicatorMode.NotShown,
			label: localization.setting__showVisualSyncIndicator,
			description: localization.setting__showVisualSyncIndicator__description,
			isEnum: true,
			options: {
				[SyncIndicatorMode.NotShown]: localization.no,
				[SyncIndicatorMode.Text]: localization.setting__showVisualSyncIndicator__textual,
				[SyncIndicatorMode.Icon]: localization.setting__showVisualSyncIndicator__icon,
			},
		},
		hideMarkdown: {
			...defaultSettingOptions,
			type: SettingItemType.String,

			value: HideMarkdownMode.None,
			label: localization.setting__hideMarkdown,
			description: localization.setting__hideMarkdown__description,
			isEnum: true,
			options: {
				[HideMarkdownMode.None]: localization.setting__hideMarkdown__none,
				[HideMarkdownMode.Some]: localization.setting__hideMarkdown__some,
			},
		},
		showLinkTooltip: {
			...defaultSettingOptions,
			value: false,
			label: localization.setting__showLinkTooltip,
			description: localization.setting__showLinkTooltip__description,
		},
		textDirection: {
			...defaultSettingOptions,
			type: SettingItemType.String,

			advanced: true,
			value: TextDirection.Auto,
			label: localization.setting__textDirection,
			description: localization.setting__textDirection__description,
			isEnum: true,
			options: {
				[TextDirection.Auto]: localization.setting__textDirection__auto,
				[TextDirection.LeftToRight]: localization.setting__textDirection__leftToRight,
				[TextDirection.RightToLeft]: localization.setting__textDirection__rightToLeft,
			},
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