# Static website SEO checker

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [繁體中文](README.zh-HK.md)

Inspect a directory of exported HTML without fetching URLs or running page scripts. The tool checks metadata, exact internal targets, language alternates and sitemap consistency, then prints a JSON report with English, Simplified Chinese, Japanese or Traditional Chinese messages.

## Run it

Use Node.js 20 or newer. No third-party packages are required.

```sh
git clone https://github.com/awesomellm/website-seo-checker.git
cd website-seo-checker
node --test seo.test.mjs
node create-fixtures.mjs
node check.mjs examples/valid --origin https://example.com --lang en
node check.mjs examples/invalid --origin https://example.com --lang en
```

The valid fixture returns exit code `0`. The intentionally invalid fixture returns `1` and reports four issues. Directory, origin or argument failures return `2`. Change the input directory to your actual static export and use its intended public origin. The checker does not transmit these files.

## Check the multilingual starter

Build [the companion starter](https://github.com/awesomellm/multilingual-website-starter/blob/main/README.md) with `https://example.com`, then run:

```sh
node check.mjs ../multilingual-website-starter/dist --origin https://example.com --lang en
```

The checked starter has 12 indexable pages and produced zero issues within this tool's stated scope. This is a check of local output, not a statement about a deployed site or search rankings.

## What is checked

- Missing or duplicate titles and descriptions, HTML language and H1 count.
- A single absolute self canonical for pages intended to be indexed.
- Internal page and asset targets, including query stripping and HTML fragment identifiers.
- Real language targets, language-tag conflicts, self references and reciprocal links.
- JSON-LD syntax; sitemap omissions, absent targets and noindex contradictions.
- An exact root `Disallow` in wildcard robots groups, for manual review.

[Check definitions and limitations](CHECKS.md) describe the assumptions. JSON property names and diagnostic codes stay stable across languages; human messages and summaries follow `--lang`.

## JavaScript API

```js
import { auditSite } from './seo.mjs';
const report = await auditSite('./export', {
  origin: 'https://example.com', language: 'en'
});
console.log(report.issueCount, report.issues);
```

The tool skips symbolic links, `.git` and `node_modules`. Fix an observed problem and rerun the affected export. Confirm server responses, content quality, translation and accessibility separately.

Maintained by [ZequnWeb](https://zequnweb.com/). MIT license (`LICENSE`).
