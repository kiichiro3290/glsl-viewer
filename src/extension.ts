import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log("🔵 glsl-viewer extension activated!");

    let disposable = vscode.commands.registerCommand('glsl-viewer.helloWorld', () => {
        console.log("🟢 glsl-viewer command executed!");
        vscode.window.showInformationMessage('Hello from GLSL Viewer!');
    });

	vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
        console.log("📄 Active editor changed:", editor.document.uri.fsPath);
    }
});


    context.subscriptions.push(disposable);

    // 🚀 拡張機能がすぐに終了しないようにするための `setInterval`
    setInterval(() => {
        console.log("🔄 glsl-viewer is still running...");
    }, 5000); // 5秒ごとにログを出力
}

export function deactivate() {
    console.log("🟡 glsl-viewer extension deactivated!");
}
