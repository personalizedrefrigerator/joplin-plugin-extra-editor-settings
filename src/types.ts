
export interface PluginSettings {
	lineNumbers: boolean;
	codeFolding: boolean;
	enableAutocomplete: boolean;

	highlightActiveLine: boolean;
	highlightActiveLineGutter: boolean;
	highlightSpaces: boolean;
	highlightTrailingSpaces: boolean;
	persistentCursorPosition: boolean;
}

export enum WebViewMessageType {
	SelectionUpdated = 'selUpdated',
	GetSettings = 'getSettings',
	Loaded = 'loaded',
}

interface GetSettingsMessage {
	type: WebViewMessageType.GetSettings;
}

interface EditorLoadedMessage {
	type: WebViewMessageType.Loaded;
}

interface CursorPositionChangedMessage {
	type: WebViewMessageType.SelectionUpdated;
	mainIndex: number;
}

export type WebViewMessage = GetSettingsMessage | EditorLoadedMessage | CursorPositionChangedMessage;
