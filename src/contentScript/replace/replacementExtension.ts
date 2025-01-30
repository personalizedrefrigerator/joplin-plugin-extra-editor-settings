import { PostMessageHandler } from "../../../api/types";
import { HideMarkdownMode } from "../../types";
import addFormattingClasses from "./addFormattingClasses";
import renderedMarkupReplacement from "./renderedMarkupReplacement";
import replaceBulletLists from "./replaceBulletLists";
import replaceCheckboxes from "./replaceCheckboxes";
import replaceDividers from "./replaceDividers";
import replaceFormatCharacters from "./replaceFormatCharacters";

export default (mode: HideMarkdownMode, postMessage: PostMessageHandler) => {
	const base = [
		replaceCheckboxes,
		replaceBulletLists,
		replaceFormatCharacters,
		replaceDividers,
		addFormattingClasses,
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