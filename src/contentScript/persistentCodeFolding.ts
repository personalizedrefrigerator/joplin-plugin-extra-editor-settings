import { codeFolding, foldGutter, foldKeymap, foldEffect, unfoldEffect } from '@codemirror/language';
import { SearchCursor } from '@codemirror/search';
import { Prec, EditorState, StateEffect, Range, Text } from '@codemirror/state';
import { EditorView, gutter, keymap } from '@codemirror/view';
import { CodeMirrorControl } from 'api/types';

export interface FoldAnchor {
	// Attaches the fold to the [occurrence]th occurrence
	// of [text]. Goal: Allow editing the note with folded content
	// on another device, without removing breaking the folded regions.
	text: string;
	occurrence: number;
	offset: number;
}

export interface CodeFold {
	startAnchor: FoldAnchor;
	endAnchor: FoldAnchor;
}

export interface CodeFoldControl {
	onFoldChange(anchorText: string, position: number): Promise<void>;
	getFolds(noteId: string): Promise<CodeFold[]>;
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

	return cursor.value.from + anchor.offset;
};


const findFoldInDoc = (doc: Text, fold: CodeFold): DocRange|null => {
	const from = findAnchorInDoc(doc, fold.startAnchor, 0);
	if (!from) return null;
	const to = findAnchorInDoc(doc, fold.endAnchor, from);
	if (!to) return null;

	return { from, to };
};

const persistentCodeFolding = (control: CodeFoldControl) => {
	const editorControl = control.editorControl;
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
		const foldEffects = folds.map((fold) => {
			const range = findFoldInDoc(view.state.doc, fold);
			if (!range) {
				return { from: 0, to: 0 };
			} else {
				return range;
			}
		}).filter(
			({ from, to }) => from !== to
		).map(range => foldEffect.of(range));

		if (!cancelled) {
			view.dispatch({ effects: foldEffects });
		}
	};

	const noteChangeHandler = EditorState.transactionExtender.of(tr => {
		for (const effect of tr.effects) {
			const setNoteIdEffect = editorControl.joplinExtensions.setNoteIdEffect;
			if (setNoteIdEffect && effect.is(setNoteIdEffect)) {
				void updateCodeFolding(effect.value as string);
			}
		}
		return null;
	});

	return [
		noteChangeHandler,
		codeFolding(),
		foldGutter(),
		gutter({}),
		Prec.low(keymap.of(foldKeymap)),
	];
};

export default persistentCodeFolding;

