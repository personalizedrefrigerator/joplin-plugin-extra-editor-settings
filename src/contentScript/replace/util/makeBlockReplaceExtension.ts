import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateField } from "@codemirror/state";
import { ReplacementExtension } from "../types";
import nodeIntersectsSelection from "./nodeIntersectsSelection";

const updateDecorations = (state: EditorState, extensionSpec: ReplacementExtension) => {
	const doc = state.doc;
	const cursorLine = doc.lineAt(state.selection.main.anchor);

	let widgets: Range<Decoration>[] = [];
	syntaxTree(state).iterate({
		enter: node => {
			const nodeLineFrom = doc.lineAt(node.from);
			const nodeLineTo = doc.lineAt(node.to);
			const selectionIsNearNode = Math.abs(nodeLineFrom.number - cursorLine.number) <= 1 || Math.abs(nodeLineTo.number - cursorLine.number) <= 1;

			if (!nodeIntersectsSelection(state.selection, node) && !selectionIsNearNode) {
				const widget = extensionSpec.createWidget(node, state);
				if (widget) {
					const decoration = Decoration.replace({
						widget,
						block: true,
					});

					widgets.push(decoration.range(nodeLineFrom.from, nodeLineTo.to));
				}
			}
		},
	});

	return Decoration.set(widgets, true);
}

export const makeBlockReplaceExtension = (extensionSpec: ReplacementExtension) => {
	const blockDecorationField = StateField.define<DecorationSet>({
		create(state) {
			return updateDecorations(state, extensionSpec);
		},
		update(decorations, transaction) {
			decorations = decorations.map(transaction.changes);
			const selectionChanged = !transaction.newSelection.eq(transaction.startState.selection);

			if (transaction.docChanged || selectionChanged) {
				decorations = updateDecorations(transaction.state, extensionSpec);
			}

			return decorations;
		},
		provide: f => EditorView.decorations.from(f),
	});
	return [
		blockDecorationField
	];
};

