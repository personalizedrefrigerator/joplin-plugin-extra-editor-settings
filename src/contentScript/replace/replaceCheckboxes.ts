import { EditorView, WidgetType } from '@codemirror/view';
import makeReplaceExtension from './makeReplaceExtension';

const checkboxClassName = 'cm-checkbox-toggle';

class CheckboxWidget extends WidgetType {
	public constructor(private checked: boolean) {
		super();
	}

	public eq(other: CheckboxWidget) {
		return other.checked == this.checked;
	}

	public toDOM() {
		const container = document.createElement('span');
		container.setAttribute('aria-hidden', 'true');
		container.classList.add(checkboxClassName);

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = this.checked;
		container.appendChild(checkbox);

		return container;
	}

	public ignoreEvent() {
		return false;
	}
}

const toggleCheckbox = (view: EditorView, pos: number) => {
	let before = view.state.doc.sliceString(Math.max(0, pos - 3), pos);
	let change;

	if (before.toLowerCase() == '[x]') {
		change = { from: pos - 3, to: pos, insert: '[ ]' };
	}
	else {
		change = { from: pos - 3, to: pos, insert: '[x]' };
	}

	view.dispatch({ changes: change });
	return true;
};

export const replaceCheckboxes = [
	EditorView.theme({
		[`& .${checkboxClassName} > input`]: {
			width: '1.1em',
			height: '1.1em',
			margin: '4px',
			verticalAlign: 'middle',
		},
	}),
	EditorView.domEventHandlers({
		mousedown: (evt, view) => {
			let target = evt.target as Element;
			if (target.nodeName === 'INPUT' && target.parentElement?.classList?.contains(checkboxClassName)) {
				return toggleCheckbox(view, view.posAtDOM(target));
			}
		}
	}),
	makeReplaceExtension({
		createWidget: (node, view) => {
			if (node.name === 'TaskMarker') {
				const content = view.state.doc.sliceString(node.from, node.to);
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
