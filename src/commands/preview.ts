import * as vscode from 'vscode';
import { registerDisposable } from '../disposables';
import * as path from 'path';
import * as fs from 'fs';

export function previewCommands (context: vscode.ExtensionContext) {
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

    // WebView からのメッセージを受信
    panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.type === "captureImage") {
          saveImage(message.data);
        }
      },
      undefined,
      context.subscriptions
    );

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

function saveImage(base64Data: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("ワークスペースが開かれていません。");
    return;
  }

  // 画像の保存先を決定
  const savePath = path.join(workspaceFolders[0].uri.fsPath, "capture.png");
  const base64Image = base64Data.replace(/^data:image\/png;base64,/, "");

  // ファイルに保存
  fs.writeFile(savePath, base64Image, "base64", (err: NodeJS.ErrnoException | null) => {
    if (err) {
      vscode.window.showErrorMessage("画像の保存に失敗しました。");
    } else {
      vscode.window.showInformationMessage(`画像を保存しました: ${savePath}`);
    }
  });
}

function getUri(
  webview: vscode.Webview,
  filePath: string,
) {
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
      /* ✅ Webview を全画面に拡張 */
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      /* ✅ div#app を全画面に */
      #app {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000; /* 例: 背景色を黒に */
      }
      #captureButton {
        width: 120px;
        height: 40px;
        font-size: 16px;
        margin-top: 10px;
        cursor: pointer;
        position: absolute;
        top: 10px;
        right: 10px;
      }
    </style>
</head>
<body>
  <div id="app"></div>
  <button id="captureButton">キャプチャ</button>
  <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
  <script>
    document.getElementById("captureButton").addEventListener("click", () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      console.error("Canvas not found!");
      return;
    }

    // Canvas の内容を画像として取得
    const imageData = canvas.toDataURL("image/png");

    // VSCode Webview にメッセージを送信
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ type: "captureImage", data: imageData });
  });
</script>
</body>
</html>`;
}
