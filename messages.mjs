const rows = {
  TITLE_MISSING: ['Missing or empty title', '标题缺失或为空', 'タイトルがないか空です', '標題缺失或空白'],
  TITLE_DUPLICATE: ['Duplicate title', '标题重复', 'タイトルが重複しています', '標題重複'],
  DESCRIPTION_MISSING: ['Missing or empty description', '页面描述缺失或为空', '説明がないか空です', '頁面描述缺失或空白'],
  DESCRIPTION_DUPLICATE: ['Duplicate description', '页面描述重复', '説明が重複しています', '頁面描述重複'],
  H1_COUNT: ['Expected one H1', '应有一个一级标题', 'H1 は一つ必要です', '應有一個一級標題'],
  LANG_MISSING: ['Missing HTML language', '缺少 HTML 语言', 'HTML の言語がありません', '缺少 HTML 語言'],
  CANONICAL_MISSING: ['Expected one absolute self canonical', '应有一个绝对自身规范地址', '絶対 URL の自己正規化指定が一つ必要です', '應有一個絕對自身標準地址'],
  CANONICAL_WRONG: ['Canonical does not match this page', '规范地址与当前页面不一致', '正規 URL がこのページと一致しません', '標準地址與目前頁面不一致'],
  INTERNAL_MISSING: ['Internal link target is missing', '内部链接目标不存在', '内部リンクの移動先がありません', '內部連結目標不存在'],
  FRAGMENT_MISSING: ['Fragment target is missing', '页面锚点不存在', 'ページ内の移動先がありません', '頁面錨點不存在'],
  ALTERNATE_INVALID: ['Invalid language alternate', '语言对应地址无效', '言語別の対応 URL が無効です', '語言對應地址無效'],
  ALTERNATE_MISSING: ['Language alternate target is missing', '语言对应目标不存在', '言語別の対応先がありません', '語言對應目標不存在'],
  ALTERNATE_LANGUAGE: ['Alternate language conflicts with target HTML', '语言标记与目标 HTML 冲突', '対応先の HTML 言語と矛盾しています', '語言標記與目標 HTML 衝突'],
  ALTERNATE_RETURN: ['Missing reciprocal language alternate', '缺少相互对应的语言地址', '相互の言語対応がありません', '缺少互相對應的語言地址'],
  ALTERNATE_SELF: ['Missing self-referencing language alternate', '缺少自身语言对应地址', '自分自身の言語対応がありません', '缺少自身語言對應地址'],
  ALTERNATE_DUPLICATE: ['Repeated language alternate', '语言对应标记重复', '言語対応が重複しています', '語言對應標記重複'],
  ALTERNATE_NOINDEX: ['Alternate points to a noindex page', '语言对应地址指向禁止索引页面', '言語対応が noindex ページを示します', '語言對應地址指向禁止索引頁面'],
  JSONLD_INVALID: ['Invalid JSON-LD syntax', 'JSON-LD 语法无效', 'JSON-LD の構文が無効です', 'JSON-LD 語法無效'],
  SITEMAP_MISSING: ['Missing sitemap.xml', '缺少 sitemap.xml', 'sitemap.xml がありません', '缺少 sitemap.xml'],
  SITEMAP_PAGE_MISSING: ['Indexable page missing from sitemap', '可索引页面未列入网站地图', '索引可能なページがサイトマップにありません', '可索引頁面未列入網站地圖'],
  SITEMAP_TARGET_MISSING: ['Sitemap URL has no exported page', '网站地图地址没有对应导出页面', 'サイトマップ URL に出力ページがありません', '網站地圖地址沒有對應匯出頁面'],
  SITEMAP_INVALID: ['Invalid or external sitemap URL', '网站地图地址无效或属于外部域名', 'サイトマップ URL が無効または外部です', '網站地圖地址無效或屬外部網域'],
  SITEMAP_NOINDEX: ['Sitemap includes a noindex page', '网站地图包含禁止索引页面', 'サイトマップに noindex ページがあります', '網站地圖包含禁止索引頁面'],
  ROBOTS_ROOT_BLOCK: ['Root Disallow rule requires review', '根路径禁止抓取规则需要复核', 'ルートの拒否ルールを確認してください', '根路徑禁止抓取規則須覆核'],
};
export const reportLanguages = ['en', 'zh-CN', 'ja', 'zh-HK'];
export function messageFor(code, language='en') {
  const index=reportLanguages.indexOf(language);
  if(index<0) throw new Error('Unsupported report language');
  if(!rows[code]) throw new Error('Unknown issue code');
  return rows[code][index];
}
export const summaries = {
  en: ['Pages checked', 'Issues found', 'No issues found within the stated checks'],
  'zh-CN': ['已检查页面', '发现的问题', '在说明的检查范围内未发现问题'],
  ja: ['検査したページ', '見つかった問題', '記載した検査範囲で問題は見つかりませんでした'],
  'zh-HK': ['已檢查頁面', '發現的問題', '在說明的檢查範圍內未發現問題'],
};
