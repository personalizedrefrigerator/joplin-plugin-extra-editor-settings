import joplin from 'api';
import { registerSettings } from './settings';
import { PluginSettings, SyncIndicatorMode, SyncStatus } from './types';
import { ContentScriptType } from 'api/types';

let registeredSyncListeners = false;
const registerSyncStatusListeners = async (onStatusChange: (newStatus: SyncStatus)=>void) => {
	if (registeredSyncListeners) {
		return;
	}

	await joplin.workspace.onSyncStart(() => {
		onStatusChange(SyncStatus.Syncing);
	});
	type SyncCompleteEvent = { withErrors: boolean; };
	await joplin.workspace.onSyncComplete((event: SyncCompleteEvent) => {
		onStatusChange(event.withErrors ? SyncStatus.SyncedWithErrors : SyncStatus.NotSyncing);
	});
	registeredSyncListeners = true;
};

joplin.plugins.register({
	onStart: async function() {
		let lastSettings: PluginSettings;
		let contentScriptRegistered = false;
		let syncStatus: SyncStatus = SyncStatus.NotSyncing;
		let onSyncStatusChange = ()=>{};
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

			if (settings.syncIndicator && settings.syncIndicator !== SyncIndicatorMode.NotShown) {
				void registerSyncStatusListeners((newStatus: SyncStatus) => {
					syncStatus = newStatus;
					onSyncStatusChange();
				});
			}
		});

		const contentScriptId = 'cm6-extended-settings';
		await joplin.contentScripts.register(ContentScriptType.CodeMirrorPlugin, contentScriptId, './contentScript/contentScript.js');
		await joplin.contentScripts.onMessage(contentScriptId, (message: string) => {
			if (message === 'getSettings') {
				contentScriptRegistered = true;
				return lastSettings;
			} else if (message === 'getSyncStatus') {
				return syncStatus;
			} else if (message === 'awaitSyncStatusChanged') {
				return new Promise<void>(resolve => {
					let priorCallback = onSyncStatusChange;
					onSyncStatusChange = () => {
						resolve();

						// Remove this listener, allow other listeners to run.
						onSyncStatusChange = priorCallback;
						priorCallback();
					};
				});
			} else if (message === 'sync') {
				void joplin.commands.execute('synchronize');
				return null;
			}
		});
	},
});
