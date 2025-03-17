# glsl-viewer

デバッグテスト
```
pnpm compile
```
左のサイドバーからデバッガを起動

ローカルで書き出す
実行に成功すると `.vsix` ファイルが生成される
```
npm install -g @vscode/vsce
npx clear-npx-cache
vsce package
```