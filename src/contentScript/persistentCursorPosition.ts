import { EditorView, ViewPlugin } from "@codemirror/view"
import { CodeMirrorControl, ContentScriptContext } from "api/types";
import { WebViewMessage, WebViewMessageType } from "../types";
import { EditorSelection } from "@codemirror/state";

// Store the cursor location in localStorage. Alternatives include Joplin's settings and
// with userData. Both, however, involve writing to Joplin's database.

const persistentCursorPosition = (editorControl: CodeMirrorControl, context: ContentScriptContext) => {
	let lastSelection = -1;
	let lastUpdateTime = Date.now();
	let nextSelectionLoc = -1;

	editorControl.registerCommand('cm6-extended-settings--set-cursor-position', (index: number) => {
		console.log('%%set cursor loc', index);
		nextSelectionLoc = index;
	});

	return [
		EditorView.updateListener.of(update => {
			const selection = update.state.selection.main.anchor;

			if (nextSelectionLoc !== -1 && update.selectionSet) {
				const loc = nextSelectionLoc;
				nextSelectionLoc = -1;
				update.view.dispatch({
					selection: EditorSelection.cursor(loc),
					scrollIntoView: true,
				});
			} else if (selection !== lastSelection) {
				const now = Date.now();
				if (now - lastUpdateTime < 1000) return;
				lastUpdateTime = now;

				console.log('%%updateCursorPos', selection);
				lastSelection = selection;
				context.postMessage({
					type: WebViewMessageType.SelectionUpdated,
					mainIndex: lastSelection,
				} as WebViewMessage);
			}
		}),
	];
};

export default persistentCursorPosition;