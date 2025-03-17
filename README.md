# glsl-viewer

## 実行
コンパイルしてサイドバーのデバッガツールを用いる。

コンパイル
```bash
pnpm compile
```

変更を検知してコンパイル。
```bash
pnpm watch
```

## パッケージ化
vsce をインストール。
```bash
npm install -g @vscode/vsce
```

ローカルで書き出す。
成功すると`.vsix`ファイルが生成される。
```bash
pnpm package
```
