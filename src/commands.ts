import * as vscode from 'vscode';
import { previewCommands } from './commands/preview';
import { registerDisposable } from './disposables';

export function registerCommands(context: vscode.ExtensionContext) {
  const command = previewCommands(context);

  registerDisposable(command);
}
