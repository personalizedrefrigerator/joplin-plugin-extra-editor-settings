import { EditorView, WidgetType } from "@codemirror/view";
import makeConcealExtension from "./makeReplaceExtension";
import { SyntaxNodeRef } from '@lezer/common';

class FormattingCharacterWidget extends WidgetType {
	public constructor() {
		super();
	}

	public eq(_other: FormattingCharacterWidget) {
		return true;
	}

	public toDOM() {
		const container = document.createElement("span");
		return container;
	}

	public ignoreEvent() {
		return true;
	}

	public get estimatedHeight(): number {
		return 0;
	}
}

const shouldFullReplace = (node: SyntaxNodeRef, view: EditorView) => {
	const getParentName = () => node.node.parent?.name;
	const getNodeStartLine = () => view.state.doc.lineAt(node.from);

	if (['HeaderMark', 'CodeMark', 'EmphasisMark'].includes(node.name)) {
		return true;
	}
	
	if ((node.name === 'URL' || node.name === 'LinkMark') && getParentName() === 'Link') {
		return true;
	}

	if (node.name === 'QuoteMark' && node.from === getNodeStartLine().from) {
		return true;
	}

	return false;
};

export const replaceFormatCharacters = [
	makeConcealExtension({
		createWidget: (node, view) => {
			if (shouldFullReplace(node, view)) {
				return new FormattingCharacterWidget();
			}
			return null;
		},
	}),
];

export default replaceFormatCharacters;
