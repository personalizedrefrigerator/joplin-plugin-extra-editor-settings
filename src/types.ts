
export enum TextDirection {
	Auto = 'auto',
	LeftToRight = 'ltr',
	RightToLeft = 'rtl',
}

export enum SyncIndicatorMode {
	NotShown = 'not-shown',	
	Text = 'text',	
	Icon = 'icon',	
}

export enum HideMarkdownMode {
	None = 'none',
	Some = 'some',
	More = 'more',
}

export interface PluginSettings {
	lineNumbers: boolean;
	codeFolding: boolean;
	enableAutocomplete: boolean;

	hideMarkdown: HideMarkdownMode;
	showLinkTooltip: boolean;

	highlightActiveLine: boolean;
	highlightActiveLineGutter: boolean;
	highlightSpaces: boolean;
	highlightTrailingSpaces: boolean;
	highlightSelectionMatches: boolean;
	bracketMatching: boolean;
	editorMaximumWidth: string;
	gridPattern: boolean;
	wordCount: boolean;
	syncIndicator: SyncIndicatorMode;

	textDirection: TextDirection,
}

export enum SyncStatus {
	NotSyncing = 'not-syncing',
	Syncing = 'syncing',
	SyncedWithErrors = 'synced-with-errors',
}
