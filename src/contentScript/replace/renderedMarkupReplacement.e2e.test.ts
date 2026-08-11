import { forceParsing } from "@codemirror/language";
import createTestEditor from "../testing/createTestEditor";
import renderedMarkupReplacement from "./renderedMarkupReplacement";

const flush = async () => {
	for (let i = 0; i < 5; i++) {
		await Promise.resolve();
		await new Promise(resolve => setTimeout(resolve, 0));
	}
};

describe('renderedMarkupReplacement e2e (HTML image sizing)', () => {
	it('applies width/height from an HTML <img> onto the rendered image', async () => {
		const doc = '<img src=":/0d1b97613684497699471fa61a31f02d" alt="x.png" width="177" height="142" />';

		// Simulate what Joplin's renderMarkup returns: resource resolved, but the
		// width/height NOT preserved as effective sizing.
		const postMessage = jest.fn(async () => ({
			html: '<p><img src="joplin-content://note-viewer/abc" alt="x.png"></p>',
		}));

		const editor = createTestEditor(doc, [ renderedMarkupReplacement(postMessage) ]);
		forceParsing(editor, editor.state.doc.length);
		await flush();

		const img = editor.dom.querySelector<HTMLImageElement>(`.cm-md-rendered-markdown img`);
		if (!img) throw new Error('No rendered image found.');

		expect(img.style.width).toBe('177px');
		expect(img.style.height).toBe('142px');

		expect(img.style.getPropertyPriority('width')).toBe('important');
		expect(img.style.getPropertyPriority('height')).toBe('important');
		expect(img.style.maxWidth).toBe('none');
		expect(img.style.maxHeight).toBe('none');
	});
});
