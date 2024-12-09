import { WidgetType } from "@codemirror/view";
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
}

const shouldFullReplace = (node: SyntaxNodeRef) => {
	if (['HeaderMark', 'CodeMark', 'QuoteMark'].includes(node.name)) {
		return true;
	}
	
	if ((node.name === 'URL' || node.name === 'LinkMark') && node.node.parent?.name === 'Link') {
		return true;
	}

	return false;
};

export const replaceFormatCharacters = [
	makeConcealExtension({
		createWidget: (node, _view) => {
			if (shouldFullReplace(node)) {
				return new FormattingCharacterWidget();
			}
			return null;
		},
	}),
];

export default replaceFormatCharacters;
