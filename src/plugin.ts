'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { Commands } from './commands';

let existingExtensions: Array<string>;

export function collectJavaExtensions(extensions: vscode.Extension<any>[]): string[] {
	const result = [];
	if (extensions && extensions.length) {
		for (let extension of extensions) {
			let contributesSection = extension.packageJSON['contributes'];
			if (contributesSection) {
				let javaExtensions = contributesSection['javaExtensions'];
				if (Array.isArray(javaExtensions) && javaExtensions.length) {
					for (let javaExtensionPath of javaExtensions) {
						result.push(path.resolve(extension.extensionPath, javaExtensionPath));
					}
				}
			}
		}
	}
	// Make a copy of extensions:
	existingExtensions = result.slice();
	return result;
}

export function onExtensionChange(extensions: vscode.Extension<any>[]) {
	if (!existingExtensions) {
		return;
	}
	const oldExtensions = new Set(existingExtensions.slice());
	const newExtensions = collectJavaExtensions(extensions);

	let added: boolean = false;
	for (const newExtension of newExtensions) {
		if (oldExtensions.has(newExtension)) {
			oldExtensions.delete(newExtension);
		} else {
			added = true;
			break;
		}
	}

	if (added || oldExtensions.size > 0) {
		const msg = 'Java Language Server has extensions changed, reload required to update the change.';
		const action = 'Restart Now';
		const restartId = Commands.RELOAD_WINDOW;
		vscode.window.showWarningMessage(msg, action).then((selection) => {
			if (action === selection) {
				vscode.commands.executeCommand(restartId);
			}
		});
	}
}
