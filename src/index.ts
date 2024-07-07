import joplin from 'api';
import { registerSettings } from './settings';
import { PluginSettings, WebViewMessage, WebViewMessageType } from './types';
import { ContentScriptType } from 'api/types';
import debounce from './utils/debounce';

const ModelTypeNote = 1;
const cursorLocationId = 'last-cursor-index';

joplin.plugins.register({
	onStart: async function() {
		let lastSettings: PluginSettings;
		let contentScriptRegistered = false;
		lastSettings = await registerSettings((settings: PluginSettings) => {
			lastSettings = settings;

			// Calling editor.execCommand before a content script is registered can cause
			// errors to be logged.
			if (contentScriptRegistered) {
				joplin.commands.execute('editor.execCommand', {
					name: 'cm6-extended-settings-update',
					args: [ settings ],
				});
			}
		});

		let selectedNoteIds: string[] = [];

		const applyCursorPosition = debounce(async () => {
			if (!lastSettings?.persistentCursorPosition) return;

			const selectedNoteIds = await joplin.workspace.selectedNoteIds();
			if (selectedNoteIds.length !== 1) return;

			const noteId = selectedNoteIds[0];
			const lastCursorPosition = await joplin.data.userDataGet(ModelTypeNote, noteId, cursorLocationId);

			if (lastCursorPosition == undefined) return;
			if (typeof lastCursorPosition !== 'number') {
				throw new Error(`Invalid cursor position value: ${lastCursorPosition}`);
			}
			
			if (contentScriptRegistered) {
				joplin.commands.execute('editor.execCommand', {
					name: 'cm6-extended-settings--set-cursor-position',
					args: [ lastCursorPosition ],
				});
			}
		}, 100);

		let lastSwitchTime = Date.now();
		const saveCursorPosition = async (cursorIndex: number) => {
			if (!lastSettings?.persistentCursorPosition) return;
			if (selectedNoteIds.length !== 1) return;
			if (Date.now() - lastSwitchTime < 300) return;

			const selectedNoteId = selectedNoteIds[0];
			console.log('save for', selectedNoteId);
			await joplin.data.userDataSet(ModelTypeNote, selectedNoteId, cursorLocationId, cursorIndex);
		};

		joplin.workspace.onNoteSelectionChange((event: any) => {
			const noteIds: string[] = event.value;
			selectedNoteIds = noteIds;
			lastSwitchTime = Date.now();
			if (noteIds.length === 1) {
				applyCursorPosition();
			}
		});

		const contentScriptId = 'cm6-extended-settings';
		await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, contentScriptId, './contentScript/contentScript.js');
		await joplin.contentScripts.onMessage(contentScriptId, (message: WebViewMessage) => {
			if (message.type === WebViewMessageType.GetSettings) {
				contentScriptRegistered = true;
				return lastSettings;
			} else if (message.type === WebViewMessageType.Loaded) {
				applyCursorPosition();
			} else if (message.type === WebViewMessageType.SelectionUpdated) {
				saveCursorPosition(message.mainIndex);
			} else {
				const exhaustivenessCheck: never = message;
				throw new Error(`Invalid message: ${exhaustivenessCheck}`);
			}
		});
	},
});
