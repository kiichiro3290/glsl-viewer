import * as vscode from "vscode";
import { registerDisposable } from "./disposables";
import { previewCommands } from "./commands/preview";

export function registerCommands(context: vscode.ExtensionContext) {
  const command = previewCommands(context);

  registerDisposable(command);
}
