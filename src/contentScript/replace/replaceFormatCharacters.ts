import { EditorView, WidgetType } from '@codemirror/view';
import makeConcealExtension from './makeReplaceExtension';
import { SyntaxNodeRef } from '@lezer/common';

const hiddenContentClassName = 'cm-md-hidden-format-chars';

class FormattingCharacterWidget extends WidgetType {
	public constructor() {
		super();
	}

	public eq(_other: FormattingCharacterWidget) {
		return true;
	}

	public toDOM() {
		const container = document.createElement('span');
		container.classList.add(hiddenContentClassName);
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
	EditorView.theme({
		[`& .${hiddenContentClassName}`]: {
			// If the container lacks content, clicking to select content
			// after the decoration selects content before the decoration
			// in some cases.
			// As a workaround, the decoration is given a small size:
			display: 'inline-block',
			width: '1px',
		},
	}),
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
