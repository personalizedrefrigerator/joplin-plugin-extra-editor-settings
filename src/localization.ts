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
	setting__persistentCursorPosition: string;
}

const defaultStrings: AppLocalization = {
	settings__appName: 'Extra editor settings',
	settings__description: 'Additional settings for Joplin\'s beta and mobile markdown editors.',
	setting__showLineNumber: 'Show line numbers',
	setting__enableCodeFolding: 'Enable code folding',
	setting__enableAutocomplete: 'Enable autocomplete',
	setting__highlightLineGutter: 'Highlight the gutter for the active line',
	setting__highlightLineGutter__description: 'Requires "show line numbers" to be enabled.',
	setting__highlightActiveLine: 'Highlight active line',
	setting__highlightSpaces: 'Highlight spaces',
	setting__highlightTrailingSpaces: 'Highlight trailing spaces',
	setting__persistentCursorPosition: 'Persistent cursor location',
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
