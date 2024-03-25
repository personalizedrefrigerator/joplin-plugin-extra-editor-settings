import joplin from 'api';
import { registerSettings } from './settings';
import { PluginSettings } from './types';
import { ContentScriptType } from 'api/types';

joplin.plugins.register({
	onStart: async function() {
		let lastSettings: PluginSettings;
		lastSettings = await registerSettings((settings: PluginSettings) => {
			lastSettings = settings;
			joplin.commands.execute('editor.execCommand', {
				name: 'cm6-extended-settings-update',
				args: [ settings ],
			});
		});

		const contentScriptId = 'cm6-extended-settings';
		await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, contentScriptId, './contentScript/contentScript.js');
		await joplin.contentScripts.onMessage(contentScriptId, (message: string) => {
			if (message === 'getSettings') {
				return lastSettings;
			}
		});
	},
});
