import { EditorView, Decoration, DecorationSet, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorState, Range, StateField } from "@codemirror/state";

export interface ImageDimensions {
	width?: string;
	height?: string;
}

interface ImagePreviewOptions {
	createWidget(nodeText: string, dimensions?: ImageDimensions): WidgetType;
}

// The Lezer Markdown parser exposes inline HTML as `HTMLTag` nodes and
// block-level HTML as `HTMLBlock` nodes, so an `<img>` can appear as either.
const imageTagRegex = /<img\b[^>]*>/i;

const getPreviewMarkup = (nodeName: string, nodeText: string): string | null => {
	if (nodeName === 'Image') {
		return nodeText;
	}

	if (nodeName === 'HTMLTag' || nodeName === 'HTMLBlock') {
		return nodeText.match(imageTagRegex)?.[0] ?? null;
	}

	return null;
};

const dimensionValueRegex = /^\s*(\d+(?:\.\d+)?%?|auto)\s*$/i;

const parseImageDimensions = (markup: string): ImageDimensions | undefined => {
	const read = (attribute: 'width' | 'height') => {
		const match = markup.match(new RegExp(`\\b${attribute}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
		const raw = match?.[2] ?? match?.[3] ?? match?.[4];
		return raw && dimensionValueRegex.test(raw) ? raw.trim() : undefined;
	};

	const width = read('width');
	const height = read('height');
	if (!width && !height) {
		return undefined;
	}

	return { width, height };
};

const updateDecorations = (state: EditorState, options: ImagePreviewOptions) => {
	const doc = state.doc;
	const widgets: Range<Decoration>[] = [];

	syntaxTree(state).iterate({
		enter: node => {
			if (node.name === 'Image' || node.name === 'HTMLTag' || node.name === 'HTMLBlock') {
				const nodeText = state.sliceDoc(node.from, node.to);
				const markup = getPreviewMarkup(node.name, nodeText);
				if (!markup) {
					return;
				}

				const dimensions = node.name === 'Image' ? undefined : parseImageDimensions(markup);
				const line = doc.lineAt(node.to);

				const decoration = Decoration.widget({
					widget: options.createWidget(markup, dimensions),
					block: true,
					side: 1,
				});

				widgets.push(decoration.range(line.to));
			}
		},
	});

	return Decoration.set(widgets, true);
};

const makeImagePreviewExtension = (options: ImagePreviewOptions) => {
	const imagePreviewField = StateField.define<DecorationSet>({
		create(state) {
			return updateDecorations(state, options);
		},
		update(decorations, transaction) {
			decorations = decorations.map(transaction.changes);

			if (transaction.docChanged) {
				decorations = updateDecorations(transaction.state, options);
			}

			return decorations;
		},
		provide: f => EditorView.decorations.from(f),
	});

	return [imagePreviewField];
};

export default makeImagePreviewExtension;
