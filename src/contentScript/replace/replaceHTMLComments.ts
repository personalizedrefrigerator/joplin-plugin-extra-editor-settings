import { Decoration, EditorView } from '@codemirror/view';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import makeBlockReplaceExtension from './utils/makeBlockReplaceExtension';
import makeInlineReplaceExtension from './utils/makeInlineReplaceExtension';

// CSS setup
const hiddenCommentClass = 'cm-hidden-html-comment';
const hideHtmlCommentsTheme = EditorView.baseTheme({
	[`& .${hiddenCommentClass}`]: {
		// Hidden comments need to have non-zero height in order to prevent
		// issues when line numbers are visible.
		height: '1px',
		display: 'inline-block',

		// Hide the content of the block
		'& > *': {
			display: 'none',
		},
	},
});

const htmlCommentSpec = (nodeName: string) => ({
	createDecoration: (node: SyntaxNode, _state: EditorState) => {
		// CommentBlock should be the node we're looking for
		if (node.name === nodeName) {
			return Decoration.mark({ class: hiddenCommentClass });
		}
		// Don't decorate anything else...
		return null;
	},
});

const hideBlockCommentsExtension = makeBlockReplaceExtension(htmlCommentSpec('CommentBlock'));
const hideInlineCommentsExtension = makeInlineReplaceExtension(htmlCommentSpec('Comment'));

const replaceHTMLComments = [
	hideBlockCommentsExtension,
	hideInlineCommentsExtension,
	hideHtmlCommentsTheme,
];

export default replaceHTMLComments;
