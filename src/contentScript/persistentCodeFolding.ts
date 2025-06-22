import { codeFolding, foldGutter, foldKeymap, foldEffect, unfoldEffect, foldable } from '@codemirror/language';
import { SearchCursor } from '@codemirror/search';
import { Prec, EditorState, Text } from '@codemirror/state';
import { EditorView, gutter, keymap } from '@codemirror/view';
import { CodeMirrorControl, ContentScriptContext } from 'api/types';

export interface FoldAnchor {
	// Attaches the fold to the [occurrence]th occurrence
	// of [text]. Goal: Allow editing the note with folded content
	// on another device, without removing breaking the folded regions.
	text: string;
	occurrence: number;
}

export interface CodeFold {
	startAnchor: FoldAnchor;
	foldLength: number;
}

export type ChangedFolds = {
	addedFolds: CodeFold[];
	removedFolds: CodeFold[];
}|{
	folds: CodeFold[];
};

export interface CodeFoldControl {
	getFolds(noteId: string): Promise<CodeFold[]>;
	onFoldsChanged(noteId: string, changedFolds: ChangedFolds): void;
	editorControl: CodeMirrorControl;
}

interface DocRange {
	from: number;
	to: number;
}

const findAnchorInDoc = (doc: Text, anchor: FoldAnchor, from: number): number|null => {
	let cursor = new SearchCursor(
		doc,
		anchor.text,
		from,
	);
	for (let i = 0; i < anchor.occurrence && !cursor.done; i++) {
		cursor = cursor.next();
	}

	// No match
	if (cursor.done) {
		return null;
	}

	return cursor.value.from;
};

const findFoldInState = (state: EditorState, fold: CodeFold): DocRange|null => {
	const from = findAnchorInDoc(state.doc, fold.startAnchor, 0);
	if (!from || from >= state.doc.length) return null;
	const line = state.doc.lineAt(from);
	const range = foldable(state, line.from, line.to);
	return range;
};

const foldFromState = (state: EditorState, from: number, to: number): CodeFold => {
	const doc = state.doc;
	const fromLine = doc.lineAt(from);

	const getOccurrence = () => {
		let cursor = new SearchCursor(
			doc,
			anchor.text,
			from,
		);
		cursor = cursor.next();
		let count = 0;
		while (!cursor.done && cursor.value.from < fromLine.from) {
			count ++;
			cursor = cursor.next();
		}
		return count;
	};

	const anchor: FoldAnchor = {
		occurrence: getOccurrence(),
		text: fromLine.text,
	};

	return {
		startAnchor: anchor,
		foldLength: to - from,
	};
};

export const codeFoldControl = (editorControl: CodeMirrorControl, context: ContentScriptContext): CodeFoldControl => {
	return {
		onFoldsChanged: (noteId, changedFolds) => {
			return context.postMessage({ type: 'onFoldsChanged', noteId, changedFolds });
		},
		editorControl,
		getFolds: async (noteId: string) => {
			return await context.postMessage({ type: 'getFolds', noteId });
		},
	};
};

const persistentCodeFolding = (control: CodeFoldControl) => {
	const editorControl = control.editorControl;
	const joplinExtensions = editorControl.joplinExtensions;
	const view: EditorView = editorControl.cm6;

	let codeFoldingUpdateCounter = 0;
	// Fetches folds associated with the given note ID and creates folds.
	const updateCodeFolding = async (noteId: string) => {
		codeFoldingUpdateCounter++;
		const initialCounter = codeFoldingUpdateCounter;
		const cancelled = () => (
			initialCounter === codeFoldingUpdateCounter
		);

		const folds = await control.getFolds(noteId);
		const foldRanges = folds.map((fold) => {
			const range = findFoldInState(view.state, fold);
			if (!range) {
				return { from: 0, to: 0 };
			} else {
				return range;
			}
		}).filter(
			({ from, to }) => from !== to
		);
		const foldEffects = foldRanges.map(range => foldEffect.of(range));

		if (!cancelled) {
			view.dispatch({ effects: foldEffects });

			if (foldEffects.length !== folds.length) {
				control.onFoldsChanged(noteId, {
					folds: foldRanges.map(range => {
						return foldFromState(view.state, range.from, range.to);
					}),
				});
			}
		}
	};

	const noteChangeHandler = EditorState.transactionExtender.of(tr => {
		let addFolds: CodeFold[] = [];
		let removeFolds: CodeFold[] = [];
		for (const effect of tr.effects) {
			const setNoteIdEffect = joplinExtensions.setNoteIdEffect;
			if (setNoteIdEffect && effect.is(setNoteIdEffect)) {
				void updateCodeFolding(effect.value as string);
			} else if (effect.is(foldEffect)) {
				addFolds.push(foldFromState(tr.state, effect.value.from, effect.value.to));
			} else if (effect.is(unfoldEffect)) {
				removeFolds.push(foldFromState(tr.state, effect.value.from, effect.value.to));
			}
		}

		if (addFolds.length || removeFolds.length) {
			control.onFoldsChanged(tr.state.facet(joplinExtensions.noteIdFacet), {
				addedFolds: addFolds,
				removedFolds: removeFolds,
			});
		}

		return null;
	});


	if (joplinExtensions.noteIdFacet) {
		void updateCodeFolding(view.state.facet(joplinExtensions.noteIdFacet));
	}

	return [
		noteChangeHandler,
		codeFolding(),
		foldGutter(),
		gutter({}),
		Prec.low(keymap.of(foldKeymap)),
	];
};

export default persistentCodeFolding;

