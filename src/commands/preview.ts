import * as vscode from 'vscode';
import { registerDisposable } from '../disposables';

export function previewCommands(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand('glsl-viewer.preview', () => {
    let panel: vscode.WebviewPanel | undefined = undefined;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active GLSL file open');
      return;
    }

    const document = editor.document;
    if (document.languageId !== 'glsl' && document.languageId !== 'plaintext') {
      vscode.window.showErrorMessage('Open a GLSL file to preview');
      return;
    }

    const fragmentShaderSource = document.getText();

    if (!panel) {
      panel = vscode.window.createWebviewPanel(
        'glslViewer',
        'GLSL Preview',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(context.extensionUri.fsPath + '/dist'),
          ],
        },
      );

      panel.webview.html = getWebviewContent(
        panel.webview,
        context.extensionUri,
      );
    }

    panel.webview.postMessage({
      type: 'updateShader',
      shader: fragmentShaderSource,
    });

    // ファイル変更時にシェーダーを更新
    const changeSubscription = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        if (event.document === document) {
          panel?.webview.postMessage({
            type: 'updateShader',
            shader: event.document.getText(),
          });
        }
      },
    );

    panel.onDidDispose(() => {
      panel = undefined;
    });

    registerDisposable(changeSubscription);
  });
}

function getUri(webview: vscode.Webview, filePath: string) {
  return webview.asWebviewUri(vscode.Uri.file(filePath));
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const webviewUri = getUri(webview, `${extensionUri.fsPath}/dist/webview.js`);

  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebView</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #app {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000; /* 例: 背景色を黒に */
      }
    </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
  <script>
</script>
</body>
</html>`;
}
