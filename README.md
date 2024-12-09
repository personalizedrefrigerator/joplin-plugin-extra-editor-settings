# Extended Markdown editor settings

This plugin adds several additional Markdown editor settings. Many of these settings are built in to Joplin's [CodeMirror](https://codemirror.net/) editor.

**In Joplin Desktop < 3.1.x**: To use this plugin, first enable the beta editor in settings (Options > General > Opt in to the editor beta).

## Available settings

![Screenshot of Joplin Desktop's settings screen for the Extended Markdown editor settings plugin](./images/screenshot-settings.png)

- **Show line numbers**: Shows line numbers to the left of the editor.
- **Enable code folding**: Adds expand/collapse buttons to the editor gutter.
- **Enable autocomplete**: Shows a completion dialog in certain code blocks.
- **Highlight the gutter for the active line**: If a gutter is shown (e.g. for line numbers), the gutter for the current line is shown in a different color.
- **Highlight spaces**: Makes spaces and tabs visible.
- **Highlight trailing spaces**: Highlights space characters at the end of lines.
- **Highlight selection matches**: If text is selected, other visible instances of the same text are highlighted.
- **Show background grid pattern**: Shows a grid pattern behind the editor's content.
- **Show word count**: Adds a panel that shows the number of words in the open note. This number is calculated differently from Joplin's built-in word counter.
- **Show visual sync indicator**: Shows an icon or text panel that indicates Joplin's current sync status.
- **Hide Markdown**: Hides or replaces formatting markup. For example, clickable checkboxes added to the start of items in checklist markup.
- **Text direction** (advanced): Allows setting the editor's text direction to right-to-left or left-to-right for all lines, regardless of system language settings.

### More information: The "Hide Markdown" setting

The "Hide Markdown" setting hides or replaces Markdown on lines that don't contain the cursor.

In particular, setting "Hide Markdown" to "Some", makes the following changes:
- **Checkbox markup:** Replaced with checkboxes:   
  ![screenshot: Checkboxes are shown to the left of checklist items](https://github.com/user-attachments/assets/a1e31328-e50c-4434-991d-57e2baa88248)
- **Links:** In links in `[title](url)` format, URLs and brackets are hidden:  
  ![screenshot: Link URLs are hidden when the cursor is on a different line](https://github.com/user-attachments/assets/e7394fed-db23-4d25-a7c2-3570ab39f486)  
  At present, clicking links does not follow them.
- **Headings:** `#`s are hidden:  
   ![screenshot: A Markdown heading labeled "Test" with a "#" character, headings level 1-4 shown without.](https://github.com/user-attachments/assets/d2841a34-aa32-45dd-9611-40a37bb8cc95)  
   Above, the cusror is on the same line as the `# Test` heading. As a result, its leading `#` markup is visible.
- **Bold/italic/code markup:** Formatting characters (e.g. `**`) are hidden:  
  ![screenshot: "Bold, italic, and code" repeated twice. First, with formatting characters, second without.](https://github.com/user-attachments/assets/821b6bcc-3338-43cc-a1a0-f927b50c399c)
- **Blockquotes:** `>`s are hidden:  
  ![screenshot: Blockquote containing "This is a blockquote!" is shown twice. The first time with the leading ">", the second time without.](https://github.com/user-attachments/assets/d15c10f9-2d8c-4f27-8c87-b6801bf528c2)


