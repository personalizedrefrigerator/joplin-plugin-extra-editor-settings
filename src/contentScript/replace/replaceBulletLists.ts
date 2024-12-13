import { EditorView, WidgetType } from '@codemirror/view';
import makeReplaceExtension from './makeReplaceExtension';

const listMarkerClassName = 'cm-bullet-list-marker';

class BulletListMarker extends WidgetType {
	private bulletMark: string;
	public constructor(depth: number) {
		super();
		if (depth % 3 === 0) {
			this.bulletMark = '▪'
		} else if (depth % 3 === 1) {
			this.bulletMark = '•';
		} else {
			this.bulletMark = '◦';
		}
	}

	public eq(other: BulletListMarker) {
		return other.bulletMark === this.bulletMark;
	}

	public toDOM() {
		const container = document.createElement('span');
		container.classList.add(listMarkerClassName);
		container.textContent = this.bulletMark;
		return container;
	}

	public updateDOM(other: HTMLElement) {
		other.textContent = this.bulletMark;
		return true;
	}
}

export const replaceBulletLists = [
	EditorView.theme({
		[`& .${listMarkerClassName}`]: {
			'pointer-events': 'none',
			'padding-left': '4px',
			'padding-right': '2px',
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
