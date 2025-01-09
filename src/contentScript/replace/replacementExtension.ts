import addFormattingClasses from "./addFormattingClasses";
import replaceBulletLists from "./replaceBulletLists";
import replaceCheckboxes from "./replaceCheckboxes";
import replaceDividers from "./replaceDividers";
import replaceFormatCharacters from "./replaceFormatCharacters";
import referenceLinkStateField from "./utils/referenceLinksStateField";

export default [
	replaceCheckboxes,
	replaceBulletLists,
	replaceFormatCharacters,
	replaceDividers,
	addFormattingClasses,
];
