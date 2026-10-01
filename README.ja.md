# 静的サイトの SEO チェックツール

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [繁體中文](README.zh-HK.md)

出力した HTML のディレクトリを検査します。URL へ通信せず、ページのスクリプトも実行しません。メタデータ、内部の移動先、言語対応、サイトマップを確認し、英語、簡体字中国語、日本語、繁体字中国語のメッセージを持つ JSON レポートを出します。

## 実行

Node.js 20 以降を使います。外部パッケージは不要です。

```sh
git clone https://github.com/awesomellm/website-seo-checker.git
cd website-seo-checker
node --test seo.test.mjs
node create-fixtures.mjs
node check.mjs examples/valid --origin https://example.com --lang ja
node check.mjs examples/invalid --origin https://example.com --lang ja
```

正常例の終了コードは `0`、意図的な失敗例は `1` で四つの問題を報告します。ディレクトリ、公開元、引数のエラーは `2` です。実サイトには静的出力のディレクトリと予定する公開元を指定します。ファイルは送信しません。

## 四言語サイトの例を検査

[対応するひな型](https://github.com/awesomellm/multilingual-website-starter/blob/main/README.ja.md) を `https://example.com` で生成して実行します。

```sh
node check.mjs ../multilingual-website-starter/dist --origin https://example.com --lang ja
```

検査した例は索引可能な 12 ページを含み、記載した範囲で問題はゼロでした。ローカル出力の結果であり、公開サイトの状態や検索順位を示すものではありません。

## 検査項目

- タイトルと説明の欠落・重複、HTML 言語、H1 の個数。
- 索引を予定するページの単一で絶対 URL の自己正規化指定。
- クエリを除いた内部ページ・資料の移動先と HTML 内の識別子。
- 言語別の移動先、言語タグの矛盾、自己参照、相互対応。
- JSON-LD 構文、サイトマップの不足、存在しないページ、noindex との矛盾。
- 全クローラー向けグループのルート拒否指定を手動確認用に報告。

[定義と制限](CHECKS.ja.md) に前提を記しています。JSON の属性名と問題コードは言語共通で、本文メッセージと要約は `--lang` に従います。

## JavaScript インターフェース

```js
import { auditSite } from './seo.mjs';
const report = await auditSite('./export', {
  origin: 'https://example.com', language: 'ja'
});
console.log(report.issueCount, report.issues);
```

シンボリックリンク、`.git`、`node_modules` は除外します。実際の問題を修正したら関連出力を再検査します。サーバー応答、内容の品質、翻訳、アクセシビリティは別に確認します。

[ZequnWeb 日本語サイト](https://zequnweb.com/jp/) が保守します。MIT ライセンス（`LICENSE`）。
