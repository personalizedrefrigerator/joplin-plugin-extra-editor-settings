import { ContentScriptContext, MarkdownEditorContentScriptModule } from "api/types";
import { PluginSettings, TextDirection } from "../types";
import { codeFolding, foldGutter } from '@codemirror/language';
import { Compartment } from "@codemirror/state";
import { EditorView, gutter, highlightActiveLine, highlightActiveLineGutter, highlightTrailingWhitespace, highlightWhitespace, lineNumbers } from "@codemirror/view";
import { highlightSelectionMatches } from '@codemirror/search';

export default (context: ContentScriptContext): MarkdownEditorContentScriptModule => {
	return {
		plugin: async (editorControl) => {
			const extensionCompartment = new Compartment();
			editorControl.addExtension([
				extensionCompartment.of([]),
			]);

			const editor: EditorView = editorControl.editor;

			const updateSettings = (settings: PluginSettings) => {
				const textDirection = settings.textDirection ?? TextDirection.Auto;
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
					settings.highlightSelectionMatches ? highlightSelectionMatches() : [],

					settings.gridPattern ? [
						EditorView.theme({
							'&.cm-editor .cm-scroller': {
								'--grid-color': 'color-mix(in srgb, var(--joplin-color) 6%, transparent)',
								background: `
									linear-gradient(var(--grid-color) 1px, transparent 2px, transparent),
									linear-gradient(90deg, var(--grid-color) 1px, transparent 2px, transparent)
								`,
								backgroundAttachment: 'local',
								backgroundSize: '1em 1em',
							},
						}),
					] : [],

					(textDirection !== TextDirection.Auto) ? [
						EditorView.theme({
							'& .cm-line': {
								direction: textDirection === TextDirection.RightToLeft ? 'rtl' : 'ltr',
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