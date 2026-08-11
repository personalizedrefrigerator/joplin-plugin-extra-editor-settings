import { forceParsing } from "@codemirror/language";
import { WidgetType } from "@codemirror/view";
import createTestEditor from "../../testing/createTestEditor";
import makeImagePreviewExtension, { ImageDimensions } from "./makeImagePreviewExtension";

class FakeWidget extends WidgetType {
	public constructor(
		public readonly nodeText: string,
		public readonly dimensions?: ImageDimensions,
	) {
		super();
	}
	public toDOM() {
		const el = document.createElement('div');
		el.textContent = this.nodeText;
		return el;
	}
}

const collect = (doc: string) => {
	const captured: FakeWidget[] = [];
	const editor = createTestEditor(doc, [
		...makeImagePreviewExtension({
			createWidget: (nodeText, dimensions) => {
				const w = new FakeWidget(nodeText, dimensions);
				captured.push(w);
				return w;
			},
		}),
	]);
	forceParsing(editor, editor.state.doc.length);
	editor.destroy();
	return captured;
};

describe('makeImagePreviewExtension HTML img', () => {
	it('detects the user-reported HTML image and extracts dimensions', () => {
		const doc = '<img src=":/0d1b97613684497699471fa61a31f02d" alt="bf1e53db2de77d1a795aa1d0cd4894f5.png" width="177" height="142" />';
		const widgets = collect(doc);
		expect(widgets).toHaveLength(1);
		expect(widgets[0].dimensions).toEqual({ width: '177', height: '142' });
	});

	it('detects a standalone HTML image on its own line among text', () => {
		const doc = 'before\n\n<img src=":/x" width="200" height="100" />\n\nafter';
		const widgets = collect(doc);
		expect(widgets.map(w => w.dimensions)).toContainEqual({ width: '200', height: '100' });
	});

	it('still detects markdown images (no dimensions)', () => {
		const doc = '![alt](:/0d1b97613684497699471fa61a31f02d)';
		const widgets = collect(doc);
		expect(widgets).toHaveLength(1);
		expect(widgets[0].dimensions).toBeUndefined();
	});
});
