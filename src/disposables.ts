import * as vscode from "vscode";

const disposables: vscode.Disposable[] = [];

/**
 * Disposable を追加
 */
export function registerDisposable(disposable: vscode.Disposable) {
  disposables.push(disposable);
}

/**
 * すべての Disposable を解放
 */
export function disposeAll() {
  while (disposables.length) {
    const disposable = disposables.pop();
    if (disposable) {
      disposable.dispose();
    }
  }
}
