import { PostMessageHandler } from "../../../api/types";
import { HideMarkdownMode } from "../../types";
import addFormattingClasses from "./addFormattingClasses";
import renderedMarkupReplacement from "./renderedMarkupReplacement";
import replaceBulletLists from "./replaceBulletLists";
import replaceCheckboxes from "./replaceCheckboxes";
import replaceDividers from "./replaceDividers";
import replaceFormatCharacters from "./replaceFormatCharacters";
import replaceHTMLComments from './replaceHTMLComments';
import replaceUnderline from './replaceUnderline';

export default (mode: HideMarkdownMode, postMessage: PostMessageHandler) => {
	const base = [
		replaceCheckboxes,
		replaceBulletLists,
		replaceFormatCharacters,
		replaceDividers,
		addFormattingClasses,
		replaceHTMLComments,
		replaceUnderline,
	];

	if (mode === HideMarkdownMode.Some) {
		return base;
	} else if (mode === HideMarkdownMode.More) {
		return [
			...base,
			renderedMarkupReplacement(postMessage),
		];
	}
	return []
};