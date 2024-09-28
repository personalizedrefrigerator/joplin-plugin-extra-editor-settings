import { EditorView, Panel, showPanel, ViewUpdate } from "@codemirror/view";
import { PostMessageHandler } from "../../api/types";
import { SyncIndicatorMode, SyncStatus } from "../types";
import { AnnotationType, EditorState, Extension } from "@codemirror/state";
import localization from "../localization";
import syncIcon from "./icons/syncIcon";
import iconDataUrl from "./icons/iconDataUrl";
import editIcon from "./icons/editIcon";

const makeSyncIndicatorPanel = (postMessage: PostMessageHandler) => (_view: EditorView): Panel => {
	const container = document.createElement('div');
	container.classList.add('sync-indicator-panel');
	
	const textStatusElement = document.createElement('div');
	textStatusElement.classList.add('status');
	container.appendChild(textStatusElement);

	let hasUnsyncedChanges = false;
	let syncStatus = SyncStatus.NotSyncing;
	const updateContent = () => {
		container.classList.remove('-idle', '-has-changes', '-not-syncing', '-syncing', '-synced-with-errors');

		// No unsaved changes and not syncing -- the indicator doesn't need to be shown.
		if (syncStatus === SyncStatus.NotSyncing && !hasUnsyncedChanges) {
			container.classList.add('-idle');
		}

		if (hasUnsyncedChanges) {
			container.classList.add('-has-changes');
		}

		let statusText = '';
		switch (syncStatus) {
			case SyncStatus.NotSyncing:
				statusText = localization.sync_status__not_syncing;
				container.classList.add('-not-syncing');
				break;
			
			case SyncStatus.Syncing:
				statusText = localization.sync_status__syncing;
				container.classList.add('-syncing');
				break;
			
			case SyncStatus.SyncedWithErrors:
				statusText = localization.sync_status__synced_with_errors;
				container.classList.add('-synced-with-errors');
				break;
		}

		textStatusElement.textContent = `[${statusText}]${hasUnsyncedChanges ? ' *' : ''}`;
	};

	let stopLoop = false;
	void (async () => {
		while (!stopLoop) {
			syncStatus = await postMessage('getSyncStatus');
			if (syncStatus === SyncStatus.Syncing) {
				hasUnsyncedChanges = false;
			}
			updateContent();

			await postMessage('awaitSyncStatusChanged');
		}
	})();

	return {
		dom: container,
		update: (update: ViewUpdate) => {
			if (update.docChanged) {
				// Only refresh if changed by a user. This avoids showing "unsynced changes" after switching
				// notes on desktop.
				const isUserChange = update.transactions.some(t => t.isUserEvent('input') || t.isUserEvent('delete'));
				if (isUserChange) {
					hasUnsyncedChanges = true;
					updateContent();
				}
			}
		},
		destroy: () => {
			stopLoop = true;
		},
		top: true,
	};
};

const syncIndicatorPanel = (mode: SyncIndicatorMode, postMessage: PostMessageHandler): Extension => {
	const makeIconUrl = (icon: string) => `url(${JSON.stringify(iconDataUrl(icon))})`;

	return [
		showPanel.of(makeSyncIndicatorPanel(postMessage)),
		EditorView.theme({
			'& .sync-indicator-panel': {
				fontFamily: 'sans-serif, monospace',
			},
			'& .sync-indicator-panel.-done': {
				opacity: 0.8,
			},
		}),
		EditorView.theme(mode === SyncIndicatorMode.Icon ? {
			'& .sync-indicator-panel': {
				overflowY: 'visible',
				position: 'absolute',
				right: 0,
				top: 0,
				// Pass click events through to the editor
				pointerEvents: 'none',
				
				'& > .status': {
					display: 'none',
				},
				'&.-synced-with-errors::before': {
					content: '"❗"',
				},
				'&.-syncing::before': {
					content: makeIconUrl(syncIcon('gray')),
					opacity: 0.7,
				},
				'&.-has-changes::before': {
					content: makeIconUrl(editIcon('gray')),
					opacity: 0.7,
				},
			},
		} : {})
	];
};

export default syncIndicatorPanel;