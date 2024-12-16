import { EditorView, WidgetType } from '@codemirror/view';
import makeBlockReplaceExtension from './utils/makeBlockReplaceExtension';

const dividerClassName = 'cm-md-divider';

class DividerWidget extends WidgetType {
	public constructor() {
		super();
	}

	public eq(_other: DividerWidget) {
		return true;
	}

	public toDOM() {
		const container = document.createElement('hr');
		container.classList.add(dividerClassName, 'cm-line');
		return container;
	}

	public ignoreEvent() {
		return true;
	}
}

const replaceDividers = [
	EditorView.theme({
		[`& .${dividerClassName}`]: {
			border: 'none',
			borderBottom: '2px solid var(--joplin-divider-color)',
		},
	}),
	makeBlockReplaceExtension({
		createWidget: (node) => {
			if (node.name === 'HorizontalRule') {
				return new DividerWidget();
			}
			return null;
		},
	}),
];

export default replaceDividers;
