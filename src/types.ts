
export enum TextDirection {
	Auto = 'auto',
	LeftToRight = 'ltr',
	RightToLeft = 'rtl',
}

export interface PluginSettings {
	lineNumbers: boolean;
	codeFolding: boolean;
	enableAutocomplete: boolean;

	highlightActiveLine: boolean;
	highlightActiveLineGutter: boolean;
	highlightSpaces: boolean;
	highlightTrailingSpaces: boolean;
	gridPattern: boolean;

	textDirection: TextDirection,
}