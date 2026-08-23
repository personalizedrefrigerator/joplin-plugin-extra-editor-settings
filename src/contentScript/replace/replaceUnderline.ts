import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

/**
 * Replaces ++text++ with underlined text.
 * This extension adds visual underline styling to text wrapped in ++ markers.
 * The ++ markers are hidden when the cursor is on a different line.
 */
const replaceUnderline = ViewPlugin.fromClass(class {
	public decorations: DecorationSet;

	public constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	private buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const doc = view.state.doc;
		const text = doc.toString();
		const cursorLine = doc.lineAt(view.state.selection.main.anchor);

		// Regular expression to match ++text++
		// Matches ++ followed by non-whitespace, then any characters (non-greedy), then ++
		const underlineRegex = /\+\+(\S(?:.*?\S)?)\+\+/g;
		
		let match: RegExpExecArray | null;
		while ((match = underlineRegex.exec(text)) !== null) {
			const from = match.index;
			const to = match.index + match[0].length;
			
			// Check if this position is within a code block or inline code
			// We'll skip rendering in code contexts
			const line = doc.lineAt(from);
			const lineText = line.text;
			const posInLine = from - line.from;
			
			// Simple heuristic: skip if inside ` ` (inline code)
			let inInlineCode = false;
			let backtickCount = 0;
			for (let i = 0; i < posInLine; i++) {
				if (lineText[i] === '`') {
					backtickCount++;
				}
			}
			// Odd number of backticks before = we're inside inline code
			if (backtickCount % 2 === 1) {
				inInlineCode = true;
			}
			
			const cursorOnSameLine = cursorLine.number === line.number;
			const shouldHideMarkers = !inInlineCode && !cursorOnSameLine;
			const shouldShowUnderline = !inInlineCode;
			
			if (shouldShowUnderline) {
				const contentFrom = from + 2;
				const contentTo = to - 2;
				
				if (shouldHideMarkers) {
					builder.add(from, from + 2, Decoration.replace({}));
				}
				
				builder.add(
					contentFrom,
					contentTo,
					Decoration.mark({
						class: 'cm-underline-content',
					})
				);
				
				if (shouldHideMarkers) {
					builder.add(to - 2, to, Decoration.replace({}));
				}
			}
		}

		return builder.finish();
	}

	public update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged || update.selectionSet) {
			this.decorations = this.buildDecorations(update.view);
		}
	}
}, {
	decorations: view => view.decorations,
});

// Theme to add underline styling
const underlineTheme = EditorView.baseTheme({
	'.cm-underline-content': {
		textDecoration: 'underline',
	},
});

export default [replaceUnderline, underlineTheme];
