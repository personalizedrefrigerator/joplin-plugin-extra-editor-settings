import joplin from 'api';
import { registerSettings } from './settings';
import { PluginSettings, SyncIndicatorMode, SyncStatus } from './types';
import { ContentScriptType } from 'api/types';
import { ChangedFolds, CodeFold } from './contentScript/persistentCodeFolding';

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

const mergeFolds = (existingFolds: CodeFold[], delta: ChangedFolds) => {
	if ('folds' in delta) {
		return delta.folds;
	} else {
		for (const fold of existingFolds) {

		}
	}
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
		await joplin.contentScripts.onMessage(contentScriptId, async (message: string|object) => {
			if (typeof message === 'object' && 'type' in message) {
				if (message.type === 'renderMarkup' && 'markup' in message) {
					if (typeof message.markup !== 'string') {
						throw new Error(`Invalid markup type in message: ${typeof message.markup}`);
					}

					const markdown = 1;
					const rendered = await joplin.commands.execute('renderMarkup', markdown, message.markup);
					return rendered;
				} else if (message.type === 'openUrl') {
					if (!('url' in message) || typeof message.url !== 'string') {
						throw new Error('Message is missing URL property or URL is not a string.');
					}

					return joplin.commands.execute('openItem', message.url);
				} else if (message.type === 'onFoldsChanged' && 'noteId' in message && 'changedFolds' in message) {
					const noteId = message.noteId;
					if (typeof noteId !== 'string') throw new Error('Invalid noteId type');
					// TODO: APPLY the changed folds to the note. Store in settings? Store in note data (synced)?
					const mergedFolds = mergeFolds(await getFoldUserData(noteId), message.changedFolds as any);
					await setFoldUserData(noteId, mergedFolds);
				} else if (message.type === 'getFolds' && 'noteId' in message) {
					// TODO: READ the folds from the note data.
					return await getFoldUserData(message.noteId);
				}
			} else if (message === 'getSettings') {
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
