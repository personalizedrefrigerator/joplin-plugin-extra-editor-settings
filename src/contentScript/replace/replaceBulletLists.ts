import { EditorView, WidgetType } from '@codemirror/view';
import makeReplaceExtension from './utils/makeInlineReplaceExtension';

const listMarkerClassName = 'cm-bullet-list-marker';

class BulletListMarker extends WidgetType {
	private className: string;
	public constructor(depth: number) {
		super();
		if (depth % 3 === 0) {
			this.className = '-depth-0'
		} else if (depth % 3 === 1) {
			this.className = '-depth-1';
		} else {
			this.className = '-depth-2';
		}
	}

	public eq(other: BulletListMarker) {
		return other.className === this.className;
	}

	public toDOM() {
		const container = document.createElement('span');
		container.classList.add(listMarkerClassName, this.className);
		container.setAttribute('aria-label', 'bullet');
		container.role = 'img';

		const content = document.createElement('span');
		content.classList.add('content');
		container.appendChild(content);

		return container;
	}

	public updateDOM(other: HTMLElement) {
		other.classList.remove('-depth-0', '-depth-1', '-depth-2');
		other.classList.add(this.className);
		return true;
	}
}

const replaceBulletLists = [
	EditorView.theme({
		[`& .${listMarkerClassName}`]: {
			'pointer-events': 'none',

			'padding-inline-start': '4px',
			'padding-inline-end': '2px',

			'&.-depth-0 > .content': {
				'border-radius': 0,
			},
			'&.-depth-2 > .content': {
				'border': '1px solid currentcolor',
				'background-color': 'transparent',
			},
		},
		[`& .${listMarkerClassName} > .content`]: {
			'display': 'inline-block',
			'--size': '5px',
			'width': 'var(--size)',
			'height': 'var(--size)',
			'box-sizing': 'border-box',
			'vertical-align': 'middle',
			'border-radius': 'var(--size)',
			'background-color': 'currentcolor',
		},
	}),
	makeReplaceExtension({
		createWidget: (node, _view, parentTagCounts) => {
			if (node.name === 'ListMark') {
				const parent = node.node.parent;
				if (parent?.name === 'ListItem' && parent?.parent?.name === 'BulletList') {
					return new BulletListMarker(parentTagCounts.get('BulletList') ?? 1);
				}
			}
			return null;
		},
	}),
];

export default replaceBulletLists;
