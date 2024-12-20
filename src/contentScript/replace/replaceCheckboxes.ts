import { EditorView, WidgetType } from '@codemirror/view';
import makeReplaceExtension from './utils/makeInlineReplaceExtension';

const checkboxClassName = 'cm-checkbox-toggle';

const toggleCheckbox = (view: EditorView, linePos: number) => {
	if (linePos >= view.state.doc.length) {
		// Position out of range
		return false;
	}

	const line = view.state.doc.lineAt(linePos);
	const checkboxMarkup = line.text.match(/\[(x|\s)\]/);
	if (!checkboxMarkup) {
		// Couldn't find the checkbox
		return false;
	}

	const isChecked = checkboxMarkup[0] === '[x]';
	const checkboxPos = checkboxMarkup.index! + line.from;

	view.dispatch({
		changes: [{ from: checkboxPos, to: checkboxPos + 3, insert: isChecked ? '[ ]' : '[x]' }],
	});
	return true;
};

class CheckboxWidget extends WidgetType {
	public constructor(private checked: boolean, private depth: number) {
		super();
	}

	public eq(other: CheckboxWidget) {
		return other.checked == this.checked && other.depth === this.depth;
	}

	private applyContainerClasses(container: HTMLElement) {
		container.classList.add(checkboxClassName);

		for (const className of [...container.classList]) {
			if (className.startsWith('-depth-')) {
				container.classList.remove(className);
			}
		}

		container.classList.add(`-depth-${this.depth}`);
	}

	public toDOM(view: EditorView) {
		const container = document.createElement('span');

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = this.checked;
		container.appendChild(checkbox);

		checkbox.oninput = () => {
			toggleCheckbox(view, view.posAtDOM(container));
		};

		this.applyContainerClasses(container);
		return container;
	}

	public updateDOM(dom: HTMLElement): boolean {
		this.applyContainerClasses(dom);

		const input = dom.querySelector('input');
		if (input) {
			input.checked = this.checked;
			return true;
		}
		return false;
	}

	public ignoreEvent() {
		return false;
	}
}

const replaceCheckboxes = [
	EditorView.theme({
		[`& .${checkboxClassName}`]: {
			'& > input': {
				width: '1.1em',
				height: '1.1em',
				margin: '4px',
				marginInlineStart: 0,
				verticalAlign: 'middle',
			},
			'&:before': {
				content: '"- ["',
				color: 'transparent',
			},
			'&:after': {
				content: '"]"',
				color: 'transparent',
			},
		},
	}),
	EditorView.domEventHandlers({
		mousedown: (evt) => {
			let target = evt.target as Element;
			if (target.nodeName === 'INPUT' && target.parentElement?.classList?.contains(checkboxClassName)) {
				// Let the checkbox handle the event
				return true;
			}
		}
	}),
	makeReplaceExtension({
		createDecoration: (node, state, parentTags) => {
			if (node.name === 'TaskMarker') {
				const content = state.doc.sliceString(node.from, node.to);
				const isChecked = content.toLowerCase().indexOf('x') !== -1;
				return new CheckboxWidget(isChecked, parentTags.get('ListItem') ?? 0);
			}
			return null;
		},
		getDecorationRange: (node) => {
			if (node.name === 'TaskMarker') {
				const container = node.node.parent?.parent;
				const listMarker = container?.getChild('ListMark');
				if (!listMarker) {
					return null;
				}

				return [ listMarker.from, node.to ];
			}

			return null;
		},
	}),
];

export default replaceCheckboxes;
