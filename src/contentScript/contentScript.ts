import { ContentScriptContext, MarkdownEditorContentScriptModule } from "api/types";
import { PluginSettings, TextDirection } from "../types";
import { codeFolding, foldGutter } from '@codemirror/language';
import { Compartment } from "@codemirror/state";
import { EditorView, gutter, highlightActiveLine, highlightActiveLineGutter, highlightTrailingWhitespace, highlightWhitespace, lineNumbers } from "@codemirror/view";

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

					settings.gridPattern ? [
						EditorView.theme({
							'&.cm-editor .cm-scroller': {
								'--grid-color': 'color-mix(in srgb, var(--joplin-color) 30%, transparent)',
								background: `
									linear-gradient(transparent 48%, var(--grid-color) 50%, transparent 51%, transparent),
									linear-gradient(90deg, transparent 48%, var(--grid-color) 50%, transparent 51%, transparent)
								`,
								backgroundAttachment: 'local',
								backgroundSize: '1em 1em',
							},
						}),
					] : [],

					((settings.textDirection ?? TextDirection.Auto) !== TextDirection.Auto) ? [
						EditorView.theme({
							// Repeat .cm-editor for additional specificity
							'&.cm-editor.cm-editor': {
								direction: settings.textDirection === TextDirection.RightToLeft ? 'rtl' : 'ltr',
							},
						}),
					] : [],
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
			const settings: PluginSettings = await context.postMessage('getSettings');
			updateSettings(settings);
		},
	}
}