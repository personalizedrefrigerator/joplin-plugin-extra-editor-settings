import joplin from 'api';
import { registerSettings } from './settings';
import { PluginSettings } from './types';
import { ContentScriptType } from 'api/types';

joplin.plugins.register({
	onStart: async function() {
		let lastSettings: PluginSettings;
		let contentScriptRegistered = false;
		lastSettings = await registerSettings((settings: PluginSettings) => {
			lastSettings = settings;

			// Calling editor.execCommand before a content script is registered can cause
			// errors to be logged.
			if (contentScriptRegistered) {
				try {
					joplin.commands.execute('editor.execCommand', {
						name: 'cm6-extended-settings-update',
						args: [ settings ],
					});
				} catch (error) {
					console.info(
						'Failed to load settings. On mobile, this can happen if the editor is not currently open. Error: ', error
					);
				}
			}
		});

		const contentScriptId = 'cm6-extended-settings';
		await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, contentScriptId, './contentScript/contentScript.js');
		await joplin.contentScripts.onMessage(contentScriptId, (message: string) => {
			if (message === 'getSettings') {
				contentScriptRegistered = true;
				return lastSettings;
			}
		});
	},
});
