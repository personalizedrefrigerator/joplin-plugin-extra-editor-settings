import { EditorState } from "@codemirror/state";
import { EditorView, Panel, ViewUpdate } from "@codemirror/view";
import localization from "../localization";

const wordCountPanel = (view: EditorView): Panel => {
	const container = document.createElement('div');
	container.classList.add('word-count-panel');

	const countWords = (() => {
		// Note: Don't use new Intl.Segmenter(navigator.language, { granularity: 'word' }) -- for long texts,
		// it can be very, very slow and freeze the app.
		
		return (text: string) => {
			return (
				text
					.split(/(?:\p{Separator}|[\n])/u)
					// Filter out empty words/words that are all symbols/punctuation.
					.filter(match => !!match.length && !match.match(/^(\p{Symbol}|\p{Punctuation}|\p{Mark}|\p{Other})*$/u))
			).length;
		};
	})();

	const numberFormatter = new Intl.NumberFormat();

	const updateContent = (state: EditorState) => {
		const wordCount = countWords(state.doc.toString());
		container.textContent = `${localization.words}: ${numberFormatter.format(wordCount)}`;
	};
	updateContent(view.state);

	return {
		dom: container,
		update: (update: ViewUpdate) => {
			if (update.docChanged) {
				updateContent(update.state);
			}
		},
	};
};

export default wordCountPanel;