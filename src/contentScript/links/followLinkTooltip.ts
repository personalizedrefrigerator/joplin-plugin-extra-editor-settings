import { syntaxTree } from "@codemirror/language";
import { EditorState, StateField } from "@codemirror/state";
import { EditorView, showTooltip, Tooltip } from "@codemirror/view";
import localization from "../../localization";
import referenceLinkStateField from "./utils/referenceLinksStateField";
import findLineMatchingLink from "./utils/findLineMatchingLink";
import getUrlAtPosition from "./utils/getUrlAtPosition";


type OnOpenLink = (url: string, view: EditorView) => void;

const getLinkTooltips = (onOpenLink: OnOpenLink, state: EditorState) => {
	const tree = syntaxTree(state);
	return state.selection.ranges.map((range): Tooltip|null => {
		if (!range.empty) return null;
		const url = getUrlAtPosition(range.anchor, tree, state);
		if (!url) return null;

		return {
			pos: range.head,
			arrow: true,
			create: (view) => {
				const dom = document.createElement('div');
				dom.classList.add('cm-md-link-tooltip');

				const link = document.createElement('button');
				link.textContent = `🔗 ${url.url}${url.label ? `: ${url.label}` : ''}`;
				link.title = localization.link__followUrl(url.url),
				link.onclick = () => {
					onOpenLink(url.url, view);
				};

				dom.appendChild(link);

				return { dom };
			},
		};
	}).filter(tooltip => !!tooltip) as Tooltip[];
};

/**
 * Provides a tooltip that allows the user to either open external links, or
 * jump to other parts of the document. If not an internal document link, `onOpenExternalLink`
 * is called. The content provided to `onOpenExternalLink` is not guaranteed to be a valid
 * link.
 */
const followLinkTooltip = (onOpenExternalLink: OnOpenLink) => {
	const openLink = (link: string, view: EditorView) => {
		const targetLine = findLineMatchingLink(link, view.state);
		if (targetLine) {
			view.dispatch({
				selection: { anchor: targetLine.to },
				scrollIntoView: true,
				effects: [
					EditorView.announce.of(`Jumped to line ${targetLine.number}`),
				],
			});
			view.focus();
		} else {
			onOpenExternalLink(link, view);
		}
	};

	const followLinkTooltipField = StateField.define<readonly Tooltip[]>({
		create: state => getLinkTooltips(openLink, state),
		update: (tooltips, transaction) => {
			if (!transaction.docChanged && !transaction.selection) {
				return tooltips;
			}

			return getLinkTooltips(openLink, transaction.state);
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
