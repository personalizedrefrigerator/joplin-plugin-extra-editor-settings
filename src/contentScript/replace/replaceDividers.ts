import { EditorView, WidgetType } from '@codemirror/view';
import makeInlineReplaceExtension from './utils/makeInlineReplaceExtension';

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
		container.classList.add(dividerClassName);
		return container;
	}

	public ignoreEvent() {
		return true;
	}
}

const replaceDividers = [
	EditorView.theme({
		[`& .${dividerClassName}`]: {
			display: 'inline-block',
			width: '100%',
			border: 'none',
			borderBottom: '2px solid var(--joplin-divider-color)',
		},
	}),
	makeInlineReplaceExtension({
		createWidget: (node) => {
			if (node.name === 'HorizontalRule') {
				return new DividerWidget();
			}
			return null;
		},
	}),
];

export default replaceDividers;
