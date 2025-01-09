import { EditorView, WidgetType } from '@codemirror/view';
import makeInlineReplaceExtension from './utils/makeInlineReplaceExtension';
import { SyntaxNodeRef } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import referenceLinkStateField, { isReferenceLink, resolveReferenceById, resolveReferenceFromLink } from './utils/referenceLinksStateField';

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

const shouldFullReplace = (node: SyntaxNodeRef, state: EditorState) => {
	const getParentName = () => node.node.parent?.name;
	const getNodeStartLine = () => state.doc.lineAt(node.from);

	if (['HeaderMark', 'CodeMark', 'EmphasisMark', 'StrikethroughMark'].includes(node.name)) {
		return true;
	}

	if ((node.name === 'URL' || node.name === 'LinkMark') && getParentName() === 'Link') {
		const parentContent = state.sliceDoc(node.node.parent!.from, node.node.parent!.to);
		if (node.name === 'LinkMark') {
			if (isReferenceLink(parentContent)) {
				return !!resolveReferenceFromLink(parentContent, state);
			}
		}
		return true;
	}

	if (node.name === 'QuoteMark' && node.from === getNodeStartLine().from) {
		return true;
	}

	return false;
};

const replaceFormatCharacters = [
	referenceLinkStateField,

	EditorView.theme({
		[`& .${hiddenContentClassName}`]: {
			// If the container lacks content, clicking to select content
			// after the decoration selects content before the decoration
			// in some cases.
			// As a workaround, the decoration is given a small size:
			display: 'inline-block',
			width: '0.1px',
		},
	}),
	makeInlineReplaceExtension({
		createDecoration: (node, state) => {
			if (shouldFullReplace(node, state)) {
				return new FormattingCharacterWidget();
			}
			return null;
		},
		getDecorationRange: (node, state) => {
			// Headers in the form "## Header" should have the "##"s and the
			// space immediately after hidden 
			if (node.name === 'HeaderMark') {
				const markerLine = state.doc.lineAt(node.from);

				// Certain header styles DON'T have a space after the header mark:
				const hasRoomForSpace = node.to + 1 >= markerLine.to;
				if (hasRoomForSpace) {
					return null;
				}

				// Include the space in the hidden region, if it's available
				if (state.doc.sliceString(node.to, node.to + 1) === ' ') {
					return [ node.from, node.to + 1 ];
				}
			}

			return null;
		},
	}),
];

export default replaceFormatCharacters;
