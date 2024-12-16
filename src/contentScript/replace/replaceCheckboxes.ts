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
	public constructor(private checked: boolean) {
		super();
	}

	public eq(other: CheckboxWidget) {
		return other.checked == this.checked;
	}

	public toDOM(view: EditorView) {
		const container = document.createElement('span');
		container.setAttribute('aria-hidden', 'true');
		container.classList.add(checkboxClassName);

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = this.checked;
		container.appendChild(checkbox);

		checkbox.oninput = () => {
			toggleCheckbox(view, view.posAtDOM(container));
		};

		return container;
	}

	public updateDOM(dom: HTMLElement): boolean {
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
		[`& .${checkboxClassName} > input`]: {
			width: '1.1em',
			height: '1.1em',
			margin: '4px',
			verticalAlign: 'middle',
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
		createWidget: (node, state) => {
			if (node.name === 'TaskMarker') {
<<<<<<< HEAD
				const content = state.sliceDoc(node.from, node.to);
=======
				const content = state.doc.sliceString(node.from, node.to);
>>>>>>> main
				const isChecked = content.toLowerCase().indexOf('x') !== -1;
				return new CheckboxWidget(isChecked);
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
