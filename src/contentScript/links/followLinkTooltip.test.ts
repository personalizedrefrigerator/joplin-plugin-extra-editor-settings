import { forceParsing } from "@codemirror/language";
import createTestEditor from "../testing/createTestEditor";
import followLinkTooltip from "./followLinkTooltip";

describe('followLinkTooltip', () => {
	it('should show a clickable tooltip for a URL link', () => {
		const doc = '[link](http://example.com/)';
		const onOpenLink = jest.fn();

		const editor = createTestEditor(doc, [ followLinkTooltip(url => onOpenLink(url)) ]);
		forceParsing(editor, editor.state.doc.length);

		editor.dispatch({
			userEvent: 'select',
			selection: { anchor: 4 },
		});
		const tooltip = editor.dom.querySelector('.cm-md-link-tooltip');
		if (!tooltip) throw new Error('No tooltip found.');

		const link = tooltip.querySelector('button');
		link!.click();

		expect(onOpenLink).toHaveBeenCalledWith('http://example.com/');
	});
});
