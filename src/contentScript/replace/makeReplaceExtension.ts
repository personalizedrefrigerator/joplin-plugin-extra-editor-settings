// Ref: https://codemirror.net/examples/bundle/
// and  https://codemirror.net/examples/decoration/

import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import { SyntaxNodeRef } from '@lezer/common';

interface ReplacementExtension {
	/** Should return the widget that replaces `node`. Returning `null` preserves `node` without replacement. */
	createWidget(node: SyntaxNodeRef, view: EditorView): WidgetType|null;
	/**
	 * Returns a range ([from, to]) to which the decoration should be applied. Returning `null`
	 * replaces the entire widget with the decoration.
	 */
	getDecorationRange?(node: SyntaxNodeRef, view: EditorView): [number, number]|null;
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
					console.log(node.name)
					const nodeContains = (point: number) => {
						return point >= node.from && point <= node.to;
					};
					const mainSelection = view.state.selection.main;
					const selectionContains = (point: number) => {
						return point >= mainSelection.from && point <= mainSelection.to;
					};
					const rangeContainsSelection = nodeContains(mainSelection.from) || nodeContains(mainSelection.to)
						|| selectionContains(node.from) || selectionContains(node.to);

					const nodeLineFrom = doc.lineAt(node.from);
					const nodeLineTo = doc.lineAt(node.from);
					const lineContainsSelection = cursorLine.number === nodeLineFrom.number || cursorLine.number === nodeLineTo.number;
	
					if (!rangeContainsSelection && !lineContainsSelection) {
						const widget = extensionSpec.createWidget(node, view);
						if (widget) {
							const decoration = Decoration.replace({
								widget,
							});

							const range = extensionSpec.getDecorationRange?.(node, view) ?? [ node.from, node.to ];
							widgets.push(decoration.range(range[0], range[1]));
						}
					}
				},
			});
		}
		this.decorations = Decoration.set(widgets, true);
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
