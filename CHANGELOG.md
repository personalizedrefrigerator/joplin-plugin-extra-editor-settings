# v1.8.0

- Changes in hidden Markdown mode:
	- **Checklists**: Align the dash in the focused item with the checkbox in other items.
	- **Links**: Underline links.
	- **Strikethrough**: Render strikethrough on nonfocused lines.
	- **Dividers**: Render dividers on other lines.
- Other changes:
	- Added a tooltip for some link types under the cursor.

# v1.7.1

- Changes:
	- Make bulleted list replacement more consistent cross-platform in hidden Markdown mode.

# v1.7.0

- Features:
	- [Keyboard shortcuts](https://codemirror.net/docs/ref/#language.foldKeymap) to expand/collapse folded items.
	- Render bulleted list markers in hidden Markdown mode (#6).
- Bug fixes:
	- Fix toggling checkboxes in hidden Markdown mode after focusing them with <kbd>tab</kbd> and the keyboard.

# v1.6.1

- Bug fixes:
	- Fix header alignment in Markdown replacement mode. (#5)

# v1.6.0

- Features:
	- Added a "Hide Markdown" setting.
	- Added a "Highlight matching brackets" setting.

# v1.5.0

- Features:
	- (Mobile only) Setting for editor maximum width.

# v1.4.1

- Bug fixes
	- Fix sync indicator may incorrectly indicate unsynced changes after switching notes on desktop.

# v1.4.0

- Features:
	- New setting: Show sync indicator in editor

# v1.3.0

- Features:
	- New setting: Show word count

# v1.2.1

- Packaging fixes:
	- Don't re-bundle `@codemirror/search` with the plugin.
	- Bump minimum Joplin version to 3.0 to use Joplin's `@codemirror/search` (requires this [upstream commit](https://github.com/laurent22/joplin/commit/c1ae449ce2a9aaf5a789c9ac731081b8747af14f)).

# v1.2.0

- Features:
	- New setting: Highlight selection matches.
- Bug fixes:
	- Fix right-to-left text setting in newer versions of Joplin.
	- Fix background grid pattern is invisible at certain zoom levels.

# v1.1.0 and v1.1.1

- New settings:
    - Background grid pattern.
	- (Advanced) Right-to-left text.