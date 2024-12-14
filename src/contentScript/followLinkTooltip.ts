import { syntaxTree } from "@codemirror/language";
import { EditorState, StateField } from "@codemirror/state";
import { EditorView, showTooltip, Tooltip } from "@codemirror/view";
import { SyntaxNode, Tree } from '@lezer/common';

const getUrlNodeAt = (pos: number, tree: Tree) => {
	let iterator = tree.resolveStack(pos);
	let urlNode: SyntaxNode|null = null;
	while (true) {
		if (iterator.node.name === 'Link') {
			urlNode = iterator.node.getChild('URL');
		} else if (iterator.node.name === 'URL') {
			urlNode = iterator.node;
		}

		if (!iterator.next || urlNode) {
			break;
		} else {
			iterator = iterator.next;
		}
	}

	return urlNode;
};

type OnOpenLink = (url: string) => void;

const getLinkTooltips = (onOpenLink: OnOpenLink, state: EditorState) => {
	const tree = syntaxTree(state);
	return state.selection.ranges.map((range): Tooltip|null => {
		if (!range.empty) return null;
		const urlNode = getUrlNodeAt(range.anchor, tree);
		if (!urlNode) return null;
		const url = state.sliceDoc(urlNode.from, urlNode.to);

		return {
			pos: range.head,
			arrow: true,
			create: () => {
				const dom = document.createElement('div');
				dom.classList.add('cm-md-link-tooltip');

				const link = document.createElement('button');
				link.textContent = `🔗 ${url}`;
				link.onclick = () => {
					onOpenLink(url);
				};

				dom.appendChild(link);

				return { dom };
			},
		};
	}).filter(tooltip => !!tooltip) as Tooltip[];
};

const followLinkTooltip = (onOpenLink: OnOpenLink) => {
	const followLinkTooltipField = StateField.define<readonly Tooltip[]>({
		create: state => getLinkTooltips(onOpenLink, state),
		update: (tooltips, transaction) => {
			if (!transaction.docChanged && !transaction.selection) {
				return tooltips;
			}

			return getLinkTooltips(onOpenLink, transaction.state);
		},
		provide: field => {
			const tooltipsFromState = (state: EditorState) => state.field(field);
			return showTooltip.computeN([field], tooltipsFromState);
		},
	});

	return [
		EditorView.theme({
			'& .cm-md-link-tooltip > button': {
				backgroundColor: 'transparent',
				border: 'transparent',
				fontSize: 'inherit',
				whiteSpace: 'pre',

				textDecoration: 'underline',
				cursor: 'pointer',
				color: 'var(--joplin-url-color)',
			},
		}),
		followLinkTooltipField,
	];
};

export default followLinkTooltip;
