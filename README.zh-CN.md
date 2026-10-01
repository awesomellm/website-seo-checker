# 静态网站 SEO 检查器

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [繁體中文](README.zh-HK.md)

检查导出 HTML 目录，不请求网址，也不执行页面脚本。工具核对元数据、精确内部目标、语言对应关系及网站地图，并输出带英文、简体中文、日文或繁体中文说明的 JSON 报告。

## 运行

需要 Node.js 20 或更新版本，无需第三方依赖包。

```sh
git clone https://github.com/awesomellm/website-seo-checker.git
cd website-seo-checker
node --test seo.test.mjs
node create-fixtures.mjs
node check.mjs examples/valid --origin https://example.com --lang zh-CN
node check.mjs examples/invalid --origin https://example.com --lang zh-CN
```

正常样例返回退出码 `0`；故意带错误的样例返回 `1` 并报告四项问题。目录、域名或参数错误返回 `2`。检查真实网站时，换成实际静态导出目录及计划公开的原站地址。工具不会上传这些文件。

## 检查四语言网站示例

用 `https://example.com` 构建[配套网站示例](https://github.com/awesomellm/multilingual-website-starter/blob/main/README.zh-CN.md)，然后执行：

```sh
node check.mjs ../multilingual-website-starter/dist --origin https://example.com --lang zh-CN
```

实测示例包含 12 个可索引页面，在本工具说明的范围内未发现问题。结果针对本地输出，不代表已部署网站的状态或搜索排名。

## 检查项目

- 标题和描述的缺失或重复、HTML 语言及一级标题数量。
- 计划索引页面是否有一个绝对自身规范地址。
- 内部页面与资料目标，包含剔除查询参数后的路径及 HTML 锚点。
- 语言目标是否存在、语言标记是否冲突、自身引用及相互对应关系。
- JSON-LD 语法、网站地图漏项、不存在的目标及禁止索引冲突。
- 通配抓取组中的精确根路径禁止规则，供人工复核。

[检查定义与限制](CHECKS.zh-CN.md) 说明具体假设。JSON 属性名及问题代码保持稳定，提示文本和摘要使用 `--lang` 指定的语言。

## JavaScript 接口

```js
import { auditSite } from './seo.mjs';
const report = await auditSite('./export', {
  origin: 'https://example.com', language: 'zh-CN'
});
console.log(report.issueCount, report.issues);
```

工具跳过符号链接、`.git` 和 `node_modules`。修正实际问题后重新检查相关导出。服务器响应、内容质量、翻译及可访问性需要单独验证。

由 [ZequnWeb 中文网站](https://zequnweb.com/zh/) 维护，采用 MIT 许可证（`LICENSE`）。
