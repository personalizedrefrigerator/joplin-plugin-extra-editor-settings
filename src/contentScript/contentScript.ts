import { ContentScriptContext, MarkdownEditorContentScriptModule } from "api/types";
import { PluginSettings, SyncIndicatorMode, TextDirection } from "../types";
import { codeFolding, foldGutter } from '@codemirror/language';
import { Compartment } from "@codemirror/state";
import { EditorView, gutter, highlightActiveLine, highlightActiveLineGutter, highlightTrailingWhitespace, highlightWhitespace, lineNumbers, showPanel } from "@codemirror/view";
import { highlightSelectionMatches } from '@codemirror/search';
import wordCountPanel from "./wordCountPanel";
import syncIndicatorPanel from "./syncIndicatorPanel";

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
					settings.lineWrapping ? [] : [
						EditorView.theme({
							'& .cm-content': {
								'white-space': 'pre',
							},
							'&': {
								// On desktop, disabling word-wrapping by default also causes
								// the viewer to shrink when the editor has long lines. Setting
								// width to 0  seems to fix this issue:
								width: '0 !important',
								'min-width': '100%',
							},
						}),
					],
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
					settings.wordCount ? [wordCountPanel] : [],
					(settings.syncIndicator && settings.syncIndicator !== SyncIndicatorMode.NotShown) ? [
						syncIndicatorPanel(settings.syncIndicator, message => context.postMessage(message))
					] : [],
					settings.editorMaximumWidth && settings.editorMaximumWidth !== 'none' ? (
						EditorView.theme({
							'&.cm-editor .cm-content': {
								maxWidth: `${settings.editorMaximumWidth}`,
								marginLeft: 'auto',
								marginRight: 'auto',
							},
						})
					) : [],

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