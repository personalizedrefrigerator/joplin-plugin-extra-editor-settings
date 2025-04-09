import { Decoration, EditorView } from '@codemirror/view';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import makeBlockReplaceExtension from './utils/makeBlockReplaceExtension';

// CSS setup
const hiddenCommentClass = 'cm-hidden-html-comment';
const hideHtmlCommentsTheme = EditorView.baseTheme({
    [`& .${hiddenCommentClass}`]: {
        display: 'none',
    },
});

const htmlCommentSpec = {
    createDecoration: (node: SyntaxNode, state: EditorState) => {
        // CommentBlock should be the node we're looking for
        if (node.name === 'CommentBlock') {
            return Decoration.mark({ class: hiddenCommentClass });
        }
        // Don't decorate anything else...
        return null;
    },
};

const hideHtmlCommentsExtension = makeBlockReplaceExtension(htmlCommentSpec);

const replaceHTMLComments = [
    hideHtmlCommentsExtension,
    hideHtmlCommentsTheme,
];

export default replaceHTMLComments;