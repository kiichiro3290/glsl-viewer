import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined;

    let disposable = vscode.commands.registerCommand('glsl-viewer.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active GLSL file open");
            return;
        }

        const document = editor.document;
        if (document.languageId !== "glsl" && document.languageId !== "plaintext") {
            vscode.window.showErrorMessage("Open a GLSL file to preview");
            return;
        }

        const fragmentShaderSource = document.getText();

        if (!panel) {
            panel = vscode.window.createWebviewPanel(
                'glslViewer',
                'GLSL Preview',
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );

            panel.webview.html = getWebviewContent();
        }

        panel.webview.postMessage({ type: 'updateShader', shader: fragmentShaderSource });

        // ファイル変更時にシェーダーを更新
        const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === document) {
                panel?.webview.postMessage({ type: 'updateShader', shader: event.document.getText() });
            }
        });

        panel.onDidDispose(() => {
            panel = undefined;
            changeSubscription.dispose();
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GLSL Preview</title>
        <style>
            body { margin: 0; overflow: hidden; }
            canvas { width: 100vw; height: 100vh; display: block; }
        </style>
    </head>
    <body>
        <canvas id="glCanvas"></canvas>
        <script>
            const canvas = document.getElementById('glCanvas');
            const gl = canvas.getContext('webgl');

            if (!gl) {
                alert('WebGL not supported');
            }

            const vertexShaderSource = \`
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            \`;

            let fragmentShaderSource = \`
                precision mediump float;

                uniform float u_time;
                uniform vec2 u_resolution;

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    gl_FragColor = vec4(uv, abs(sin(u_time)), 1.0);
                }
            \`;

            function compileShader(gl, type, source) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error(gl.getShaderInfoLog(shader));
                    return null;
                }
                return shader;
            }

            function createShaderProgram() {
                const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
                const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

                if (!vertexShader || !fragmentShader) {
                    alert('Shader compilation failed');
                    throw new Error("Shader compilation failed");
                }

                const program = gl.createProgram();
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.error(gl.getProgramInfoLog(program));
                }

                gl.useProgram(program);
                return program;
            }

            let program = createShaderProgram();

            // バッファ設定
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,  1, -1,  -1, 1,
                -1, 1,   1, -1,   1, 1
            ]), gl.STATIC_DRAW);

            const position = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

            // uniform locations
            let uTime = gl.getUniformLocation(program, "u_time");
            let uResolution = gl.getUniformLocation(program, "u_resolution");

            // 画面サイズ更新
            function updateResolution() {
                gl.uniform2f(uResolution, canvas.width, canvas.height);
            }

            window.addEventListener("resize", () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
                updateResolution();
            });

            updateResolution();

            function render(time) {
                console.log(time*0.001);
                gl.uniform1f(uTime, time * 0.001);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                requestAnimationFrame(render);
            }

            render(0);

            // VSCode からのメッセージを受信してシェーダーを更新
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.type === 'updateShader') {
                    fragmentShaderSource = message.shader;
                    program = createShaderProgram();

                    uTime = gl.getUniformLocation(program, "u_time");
                    uResolution = gl.getUniformLocation(program, "u_resolution");

                    gl.useProgram(program);

                    updateResolution();
                }
            });
        </script>
    </body>
    </html>`;
}
