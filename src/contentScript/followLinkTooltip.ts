import { syntaxTree } from "@codemirror/language";
import { EditorState, StateField, Text } from "@codemirror/state";
import { EditorView, showTooltip, Tooltip } from "@codemirror/view";
import { SyntaxNodeRef, Tree } from '@lezer/common';
import localization from "../localization";
import referenceLinkStateField, { isReferenceLink, resolveReferenceFromLink } from "./replace/utils/referenceLinksStateField";

const getUrlAt = (pos: number, tree: Tree, state: EditorState) => {
	const nodeText = (node: SyntaxNodeRef) => {
		return state.doc.sliceString(node.from, node.to);
	};

	let iterator = tree.resolveStack(pos);

	while (true) {
		if (iterator.node.name === 'Link') {
			const urlNode = iterator.node.getChild('URL');
			if (urlNode) {
				return nodeText(urlNode);
			}
			const fullLinkText = nodeText(iterator.node);
			const referenceLink = resolveReferenceFromLink(fullLinkText, state);
			if (referenceLink) {
				return referenceLink;
			}
		} else if (iterator.node.name === 'URL') {
			return nodeText(iterator.node);
		}

		if (!iterator.next) {
			break;
		} else {
			iterator = iterator.next;
		}
	}

	return null;
};

type OnOpenLink = (url: string) => void;

const getLinkTooltips = (onOpenLink: OnOpenLink, state: EditorState) => {
	const tree = syntaxTree(state);
	return state.selection.ranges.map((range): Tooltip|null => {
		if (!range.empty) return null;
		const url = getUrlAt(range.anchor, tree, state);
		if (!url) return null;

		return {
			pos: range.head,
			arrow: true,
			create: () => {
				const dom = document.createElement('div');
				dom.classList.add('cm-md-link-tooltip');

				const link = document.createElement('button');
				link.textContent = `🔗 ${url}`;
				link.title = localization.link__followUrl(url),
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
		referenceLinkStateField,
		EditorView.theme({
			'& .cm-md-link-tooltip > button': {
				backgroundColor: 'transparent',
				border: 'transparent',
				fontSize: 'inherit',
	
				whiteSpace: 'pre',
				maxWidth: '95vw',
				textOverflow: 'ellipsis',
				overflowX: 'hidden',

				textDecoration: 'underline',
				cursor: 'pointer',
				color: 'var(--joplin-url-color)',
			},
		}),
		followLinkTooltipField,
	];
};

export default followLinkTooltip;
