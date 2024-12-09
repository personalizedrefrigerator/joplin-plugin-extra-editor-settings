// Ref: https://codemirror.net/examples/bundle/
// and  https://codemirror.net/examples/decoration/

import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import { SyntaxNodeRef } from '@lezer/common';

interface ReplacementExtension {
	createWidget(node: SyntaxNodeRef, view: EditorView): WidgetType|null;
}


export const makeConcealExtension = (extensionSpec: ReplacementExtension) => ViewPlugin.fromClass(class {
	public decorations: DecorationSet;

	public constructor(view: EditorView) {
		this.updateDecorations(view);
	}

	private updateDecorations(view: EditorView) {
		const doc = view.state.doc;
		const cursorLine = doc.lineAt(view.state.selection.main.anchor);

		let widgets: Range<Decoration>[] = [];
		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from, to,
				enter: node => {
					const mainSelectionIndex = view.state.selection.main.head;
					const rangeContainsSelection = mainSelectionIndex >= node.from && mainSelectionIndex <= node.to;

					const nodeLineFrom = doc.lineAt(node.from);
					const nodeLineTo = doc.lineAt(node.from);
					const lineContainsSelection = cursorLine.number === nodeLineFrom.number || cursorLine.number === nodeLineTo.number;
	
					if (!rangeContainsSelection && !lineContainsSelection) {
						const widget = extensionSpec.createWidget(node, view);
						if (widget) {
							const decoration = Decoration.replace({
								widget,
							});
		
							widgets.push(decoration.range(node.from, node.to));
						}
					}
				},
			});
		}
		this.decorations = Decoration.set(widgets);
	};

	public update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged || update.selectionSet) {
			this.updateDecorations(update.view);
		}
	}
}, {
	decorations: view => view.decorations,
});

export default makeConcealExtension;
