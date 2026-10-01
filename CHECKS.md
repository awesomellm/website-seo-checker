# Check definitions and review decisions

[English](CHECKS.md) | [简体中文](CHECKS.zh-CN.md) | [日本語](CHECKS.ja.md) | [繁體中文](CHECKS.zh-HK.md)

The report uses stable codes so CI or a spreadsheet can group the same issue across report languages. Every issue includes the affected page and the values needed to inspect it.

## Metadata and canonicals

`TITLE_MISSING` and `DESCRIPTION_MISSING` report empty values. Duplicate checks compare normalized text across indexable pages. `H1_COUNT` expects one H1. These are project conventions for review, not a complete list of search-engine requirements. `CANONICAL_WRONG` means the canonical differs from the exported page's expected self URL; a deliberately canonicalized duplicate needs a separate editorial decision.

## Links and language relationships

Internal checks use the configured public origin, resolve relative URLs and remove query strings before looking up files. They check HTML fragment identifiers on known pages. They do not fetch external destinations. The HTML reader is a lightweight tag scanner, not a browser parser: malformed markup, `<base>` behavior, script-generated links, unusual entity names or client routing need separate review.

Language checks require targets within the same export and origin. Cross-domain language alternates need manual validation and are reported for review. The checker compares primary languages and explicit script/region conflicts; it cannot judge translation equivalence or fully validate every language code. Reciprocal links and self references must use exported absolute URLs. `x-default` must have a real target; its suitability is an editorial decision.

## Sitemap, robots and structured data

The input is one `sitemap.xml` containing page `<loc>` entries. Sitemap indexes, compressed files and live HTTP status checks are outside this version. Noindex is read from HTML robots/googlebot metadata, not response headers. Robots inspection only reports exact root rules in wildcard groups; it is not a complete robots policy interpreter. JSON-LD checking verifies JSON syntax, not schema eligibility or rich results.

## Act on the report

Inspect the reported page and intended behavior before changing code. Repair broken targets, update direct links, confirm canonical choices and correct actual language pairs. Rebuild and rerun the export, then verify deployed responses. Use [the migration guide](https://github.com/awesomellm/website-migration-kit/blob/main/MIGRATION.md) for hosting checks.
