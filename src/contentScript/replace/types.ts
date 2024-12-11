import type { EditorState } from "@codemirror/state";
import type { WidgetType } from "@codemirror/view";
import type { SyntaxNodeRef } from '@lezer/common';


export interface ReplacementExtension {
	/** Should return the widget that replaces `node`. Returning `null` preserves `node` without replacement. */
	createWidget(node: SyntaxNodeRef, state: EditorState): WidgetType|null;
	/**
	 * Returns a range ([from, to]) to which the decoration should be applied. Returning `null`
	 * replaces the entire widget with the decoration.
	 */
	getDecorationRange?(node: SyntaxNodeRef, state: EditorState): [number, number]|null;
}
