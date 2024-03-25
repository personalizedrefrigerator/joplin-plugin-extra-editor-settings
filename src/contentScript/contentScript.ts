import { ContentScriptContext, MarkdownEditorContentScriptModule } from "api/types";
import { PluginSettings } from "../types";
import { codeFolding, foldGutter } from '@codemirror/language';
import { Compartment } from "@codemirror/state";
import { EditorView, gutter, highlightActiveLine, highlightActiveLineGutter, highlightTrailingWhitespace, highlightWhitespace, lineNumbers } from "@codemirror/view";
import splitEditor from "./splitEditor";

export default (context: ContentScriptContext): MarkdownEditorContentScriptModule => {
	return {
		plugin: async (editorControl) => {
			const extensionCompartment = new Compartment();
			editorControl.addExtension([
				extensionCompartment.of([]),
				EditorView.baseTheme({
					'& .cm-ext-split-panel > .cm-editor': {
						'height': '50vh',
					},
				}),
			]);

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
				];
				(editorControl.editor as EditorView).dispatch({
					effects: [
						extensionCompartment.reconfigure(extensions),
					],
				});

				if (settings.registerExtraVimCommands) {
					const Vim = (editorControl as any).Vim;
					if (Vim) {
						Vim.defineEx('split', 'sp', () => {
							splitEditor(editorControl.editor);
						});
					}
				}
			}

			editorControl.registerCommand('cm6-extended-settings-update', (settings: PluginSettings) => {
				updateSettings(settings);
			});
			const settings: PluginSettings = await context.postMessage('getSettings');
			updateSettings(settings);
			(window as any).ec = editorControl;
		},
	}
}