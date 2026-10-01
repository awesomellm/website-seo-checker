# 靜態網站 SEO 檢查器

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [繁體中文](README.zh-HK.md)

檢查匯出 HTML 目錄，不請求網址，也不執行頁面程式。工具核對中繼資料、精確內部目標、語言對應關係及網站地圖，並輸出帶英文、簡體中文、日文或繁體中文說明的 JSON 報告。

## 執行

需要 Node.js 20 或更新版本，毋須第三方相依套件。

```sh
git clone https://github.com/awesomellm/website-seo-checker.git
cd website-seo-checker
node --test seo.test.mjs
node create-fixtures.mjs
node check.mjs examples/valid --origin https://example.com --lang zh-HK
node check.mjs examples/invalid --origin https://example.com --lang zh-HK
```

正常樣例回傳結束碼 `0`；故意包含錯誤的樣例回傳 `1` 並報告四項問題。目錄、網域或參數錯誤回傳 `2`。檢查真實網站時，換成實際靜態匯出目錄及計劃公開的來源地址。工具不會上傳這些檔案。

## 檢查四語言網站示例

用 `https://example.com` 建置[配套網站示例](https://github.com/awesomellm/multilingual-website-starter/blob/main/README.zh-HK.md)，再執行：

```sh
node check.mjs ../multilingual-website-starter/dist --origin https://example.com --lang zh-HK
```

實測示例包含 12 個可索引頁面，在本工具說明的範圍內未發現問題。結果針對本機輸出，不代表已部署網站的狀態或搜尋排名。

## 檢查項目

- 標題與描述的缺失或重複、HTML 語言及一級標題數量。
- 計劃索引頁面是否有一個絕對自身標準地址。
- 內部頁面與資料目標，包含移除查詢參數後的路徑及 HTML 錨點。
- 語言目標是否存在、語言標記是否衝突、自身引用及互相對應關係。
- JSON-LD 語法、網站地圖漏項、不存在的目標及禁止索引衝突。
- 通配抓取組中的精確根路徑禁止規則，供人工覆核。

[檢查定義與限制](CHECKS.zh-HK.md) 說明具體假設。JSON 屬性名稱及問題代碼保持穩定，提示文字與摘要使用 `--lang` 指定的語言。

## JavaScript 介面

```js
import { auditSite } from './seo.mjs';
const report = await auditSite('./export', {
  origin: 'https://example.com', language: 'zh-HK'
});
console.log(report.issueCount, report.issues);
```

工具略過符號連結、`.git` 及 `node_modules`。修正實際問題後重新檢查相關匯出。伺服器回應、內容品質、翻譯及無障礙操作須另行驗證。

由 [ZequnWeb 繁體中文網站](https://zequnweb.com/zh-hk/) 維護，採用 MIT 授權（`LICENSE`）。
