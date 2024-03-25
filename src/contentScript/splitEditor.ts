import { codeFolding } from "@codemirror/language";
import { Annotation, EditorState, StateEffect, Transaction } from "@codemirror/state";
import { EditorView, drawSelection, keymap, lineNumbers, showPanel } from "@codemirror/view";

// Prevents infinite recursion
const syncAnnotation = Annotation.define<boolean>();

const syncDispatch = (transaction: Transaction, toView: EditorView) => {
	// Based on https://codemirror.net/examples/split/
	if (!transaction.changes.empty && !transaction.annotation(syncAnnotation)) {
		const annotations: Annotation<string|boolean>[] = [syncAnnotation.of(true)];
		const userEvent = transaction.annotation(Transaction.userEvent);
		if (userEvent) {
			annotations.push(Transaction.userEvent.of(userEvent));
		}
		toView.dispatch({
			changes: transaction.changes,
			annotations,
		});
	}
};


export default (mainView: EditorView) => {
	const dom = document.createElement('div');
	dom.classList.add('cm-ext-split-panel');

	const newView: EditorView = new EditorView({
		state: mainView.state,
		parent: dom,
	});
	newView.dispatch({
		effects: [
			StateEffect.appendConfig.of([
				EditorState.transactionExtender.of(tr => {
					syncDispatch(tr, mainView);
					return null;
				}),
			]),
		],
	});

	const createPanel = () => {
		return { top: true, dom };
	};
	mainView.dispatch({
		effects: [
			StateEffect.appendConfig.of([
				showPanel.of(createPanel),
				EditorState.transactionExtender.of(tr => {
					syncDispatch(tr, newView);
					return null;
				}),
			]),
		],
	});
};