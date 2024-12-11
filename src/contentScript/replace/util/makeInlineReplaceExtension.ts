// Ref: https://codemirror.net/examples/bundle/
// and  https://codemirror.net/examples/decoration/

import { EditorView, Decoration, WidgetType, DecorationSet } from "@codemirror/view";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import { SyntaxNodeRef } from '@lezer/common';
import { ReplacementExtension } from "../types";
import nodeIntersectsSelection from "./nodeIntersectsSelection";


export const makeInlineReplaceExtension = (extensionSpec: ReplacementExtension) => ViewPlugin.fromClass(class {
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
					const nodeLineFrom = doc.lineAt(node.from);
					const nodeLineTo = doc.lineAt(node.to);
					const nodeLineContainsSelection = cursorLine.number === nodeLineFrom.number || cursorLine.number === nodeLineTo.number;
	
					if (!nodeIntersectsSelection(view.state.selection, node) && !nodeLineContainsSelection) {
						const widget = extensionSpec.createWidget(node, view.state);
						if (widget) {
							const decoration = Decoration.replace({
								widget,
							});

							let range = extensionSpec.getDecorationRange?.(node, view.state) ?? [ node.from, node.to ];
							const rangeLineFrom = doc.lineAt(range[0]);
							const rangeLineTo = doc.lineAt(range[1]);

							// Inline decoration rendering fails if more than a single line is
							// replaced. Fall back to replacing just the first line:
							if (rangeLineFrom.number !== rangeLineTo.number) {
								range = [range[0], rangeLineFrom.to];
							}

							if (range[0] <= range[1]) {
								widgets.push(decoration.range(range[0], range[1]));
							} else {
								console.warn('Invalid range:', range[0], 'to', range[1]);
							}
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

export default makeInlineReplaceExtension;
