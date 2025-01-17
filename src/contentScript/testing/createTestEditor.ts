import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";

const createTestEditor = (doc: string, extensions: Extension[]) => {
	return new EditorView({
		parent: document.body,
		doc,
		extensions: [
			markdown(),
			...extensions,
		],
	});
};

export default createTestEditor;
