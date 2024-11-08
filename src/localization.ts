interface AppLocalization {
	settings__appName: string;
	settings__description: string;
	setting__showLineNumber: string;
	setting__enableCodeFolding: string;
	setting__enableAutocomplete: string;
	setting__highlightLineGutter: string;
	setting__highlightLineGutter__description: string;
	setting__highlightActiveLine: string;
	setting__highlightSpaces: string;
	setting__highlightTrailingSpaces: string;
	setting__highlightSelectionMatches: string;
	setting__showGridPattern: string;
	setting__showWordCount: string;
	setting__textDirection: string;
	setting__textDirection__description: string;
	setting__textDirection__auto: string;
	setting__textDirection__leftToRight: string;
	setting__textDirection__rightToLeft: string;

	setting__editorMaximumWidth: string;
	setting__editorMaximumWidth__description: string;
	setting__editorMaximumWidth__none: string;

	setting__showVisualSyncIndicator: string;
	setting__showVisualSyncIndicator__description: string;
	setting__showVisualSyncIndicator__textual: string;
	setting__showVisualSyncIndicator__icon: string;

	sync_status__not_syncing: string;
	sync_status__syncing: string;
	sync_status__synced_with_errors: string;

	words: string;
	yes: string;
	no: string;
}

const defaultStrings: AppLocalization = {
	settings__appName: 'Extra editor settings',
	settings__description: 'Additional settings for Joplin\'s beta and mobile Markdown editors.',
	setting__showLineNumber: 'Show line numbers',
	setting__enableCodeFolding: 'Enable code folding',
	setting__enableAutocomplete: 'Enable autocomplete',

	setting__highlightLineGutter: 'Highlight the gutter for the active line',
	setting__highlightLineGutter__description: 'Requires "show line numbers" to be enabled.',
	setting__highlightActiveLine: 'Highlight active line',
	setting__highlightSpaces: 'Highlight spaces',
	setting__highlightTrailingSpaces: 'Highlight trailing spaces',
	setting__highlightSelectionMatches: 'Highlight selection matches',

	setting__showGridPattern: 'Show background grid pattern',
	setting__showWordCount: 'Show word count',
	setting__showVisualSyncIndicator: 'Show visual sync indicator',
	setting__showVisualSyncIndicator__description: 'Shows the sync status in the Markdown editor.',

	setting__editorMaximumWidth: 'Editor maximum width',
	setting__editorMaximumWidth__description: 'Setting this to a positive number (e.g. 600) centers the editor and prevents it from having a width larger than this size. Set this to "none" for the editor to fill the screen.',
	setting__editorMaximumWidth__none: 'None',

	setting__textDirection: 'Text direction',
	setting__textDirection__description: 'Overrides the default direction of text in the CodeMirror editor. For most users, this should be set to "auto".',
	setting__textDirection__auto: 'Auto',
	setting__textDirection__leftToRight: 'Left-to-right',
	setting__textDirection__rightToLeft: 'Right-to-left',

	setting__showVisualSyncIndicator__textual: 'With text',
	setting__showVisualSyncIndicator__icon: 'With an icon',

	sync_status__not_syncing: 'Not syncing',
	sync_status__syncing: 'Syncing...',
	sync_status__synced_with_errors: 'Failed to sync',

	words: 'Words',
	yes: 'Yes',
	no: 'No',
};

const localizations: Record<string, AppLocalization> = {
	en: defaultStrings,

	es: {
		...defaultStrings,
	},
};

let localization: AppLocalization | undefined;

const languages = [...navigator.languages];
for (const language of navigator.languages) {
	const localeSep = language.indexOf('-');

	if (localeSep !== -1) {
		languages.push(language.substring(0, localeSep));
	}
}

for (const locale of languages) {
	if (locale in localizations) {
		localization = localizations[locale];
		break;
	}
}

if (!localization) {
	console.log('No supported localization found. Falling back to default.');
	localization = defaultStrings;
}

export default localization!;
