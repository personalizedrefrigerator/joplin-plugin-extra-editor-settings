import { EditorView, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateField } from "@codemirror/state";

interface ImagePreviewOptions {
	createWidget(nodeText: string): WidgetType;
}

const updateDecorations = (state: EditorState, options: ImagePreviewOptions) => {
	const doc = state.doc;
	const widgets: Range<Decoration>[] = [];

	syntaxTree(state).iterate({
		enter: node => {
			if (node.name === 'Image') {
				const nodeText = state.sliceDoc(node.from, node.to);
				const line = doc.lineAt(node.from);

				const decoration = Decoration.widget({
					widget: options.createWidget(nodeText),
					block: true,
					side: 1,
				});

				widgets.push(decoration.range(line.to));
			}
		},
	});

	return Decoration.set(widgets, true);
};

const makeImagePreviewExtension = (options: ImagePreviewOptions) => {
	const imagePreviewField = StateField.define<DecorationSet>({
		create(state) {
			return updateDecorations(state, options);
		},
		update(decorations, transaction) {
			decorations = decorations.map(transaction.changes);

			if (transaction.docChanged) {
				decorations = updateDecorations(transaction.state, options);
			}

			return decorations;
		},
		provide: f => EditorView.decorations.from(f),
	});

	return [imagePreviewField];
};

export default makeImagePreviewExtension;
