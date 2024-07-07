import { ContentScriptContext, MarkdownEditorContentScriptModule } from "api/types";
import { PluginSettings, WebViewMessageType } from "../types";
import { codeFolding, foldGutter } from '@codemirror/language';
import { Compartment, EditorSelection } from "@codemirror/state";
import { EditorView, gutter, highlightActiveLine, highlightActiveLineGutter, highlightTrailingWhitespace, highlightWhitespace, lineNumbers } from "@codemirror/view";
import persistentCursorPosition from "./persistentCursorPosition";

export default (context: ContentScriptContext): MarkdownEditorContentScriptModule => {
	return {
		plugin: async (editorControl) => {
			const extensionCompartment = new Compartment();
			editorControl.addExtension([
				extensionCompartment.of([]),
			]);

			const editor: EditorView = editorControl.editor;

			const updateSettings = (settings: PluginSettings) => {
				const extensions = [
					settings.lineNumbers ? [ lineNumbers(), highlightActiveLineGutter(), gutter({}) ] : [],
					settings.codeFolding ? [ codeFolding(), foldGutter(), gutter({}) ] : [],
					editorControl.joplinExtensions.enableLanguageDataAutocomplete.of(settings.enableAutocomplete),
					settings.highlightActiveLine ? [
						highlightActiveLine(),

						EditorView.baseTheme({
							'&light .cm-line.cm-activeLine': {
								backgroundColor: 'rgba(100, 100, 140, 0.1)',
							},
							'&dark .cm-line.cm-activeLine': {
								backgroundColor: 'rgba(200, 200, 240, 0.1)',
							},
						}),
					] : [],
					settings.highlightActiveLineGutter ? highlightActiveLineGutter() : [],
					settings.highlightSpaces ? highlightWhitespace() : [],
					settings.highlightTrailingSpaces ? highlightTrailingWhitespace() : [],
					settings.persistentCursorPosition ? persistentCursorPosition(editorControl, context) : [],
				];
				editor.dispatch({
					effects: [
						extensionCompartment.reconfigure(extensions),
					],
				});
			};

			editorControl.registerCommand('cm6-extended-settings-update', (settings: PluginSettings) => {
				updateSettings(settings);
			});

			await context.postMessage({ type: WebViewMessageType.Loaded });

			const settings: PluginSettings = await context.postMessage({ type: WebViewMessageType.GetSettings });
			updateSettings(settings);
		},
	}
}