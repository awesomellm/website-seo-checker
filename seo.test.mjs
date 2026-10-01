import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditSite } from './seo.mjs';
import { createFixtures } from './create-fixtures.mjs';
const origin='https://example.com';
const html=(path='/',extra='',body='<h1>Example</h1>',language='en',title=path)=>`<html lang="${language}"><head><title>${title}</title><meta content="Description for ${path}" name="description"><link href="${origin}${path}" rel="canonical">${extra}</head><body>${body}</body></html>`;
async function sandbox(run){const root=await mkdtemp(join(tmpdir(),'zq-seo-'));try{await run(root);}finally{await rm(root,{recursive:true,force:true});}}
async function page(root,path,source){const dir=join(root,path.slice(1));await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),source);}
async function sitemap(root,paths){await writeFile(join(root,'sitemap.xml'),`<urlset>${paths.map(path=>`<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`);}

test('valid and invalid fixtures produce different reports and CLI exit codes',async()=>sandbox(async root=>{
  await createFixtures(root);
  assert.equal((await auditSite(join(root,'valid'),{origin})).issueCount,0);
  const report=await auditSite(join(root,'invalid'),{origin,language:'zh-CN'});
  assert.deepEqual(new Set(report.issues.map(issue=>issue.code)),new Set(['TITLE_MISSING','DESCRIPTION_MISSING','H1_COUNT','INTERNAL_MISSING']));
  assert.ok(report.issues.find(i=>i.code==='TITLE_MISSING').message.includes('标题'));
  for(const [name,status] of [['valid',0],['invalid',1]]){
    const command=spawnSync(process.execPath,['check.mjs',join(root,name),'--origin',origin],{cwd:new URL('.',import.meta.url),encoding:'utf8'});
    assert.equal(command.status,status);assert.ok(JSON.parse(command.stdout).pagesChecked===1);
  }
}));
test('titles and descriptions are compared across indexable pages',async()=>sandbox(async root=>{
  await page(root,'/',html('/','',undefined,'en','Same'));
  await page(root,'/other/',html('/other/','',undefined,'en','Same').replace('Description for /other/','Description for /'));
  await sitemap(root,['/','/other/']);
  assert.deepEqual(new Set((await auditSite(root,{origin})).issues.map(i=>i.code)),new Set(['TITLE_DUPLICATE','DESCRIPTION_DUPLICATE']));
}));
test('query strings and valid fragments do not create false broken-link reports',async()=>sandbox(async root=>{
  await page(root,'/',html('/','','<h1>Example</h1><a href="/other/?model=DEMO-02#details">Product</a>'));
  await page(root,'/other/',html('/other/','','<h1>Product</h1><div id="details">Details</div>'));
  await sitemap(root,['/','/other/']);
  assert.equal((await auditSite(root,{origin})).issueCount,0);
}));
test('comments, inline scripts and textarea examples do not count as real headings or links',async()=>sandbox(async root=>{
  await page(root,'/',html('/','','<h1>Example</h1><!-- <h1>Fake</h1> --><script>const example="<h1>Fake</h1><a href=\'/fake/\'>";</script><textarea><h1>Fake</h1></textarea>'));
  await sitemap(root,['/']);assert.equal((await auditSite(root,{origin})).issueCount,0);
}));
test('four languages accept reciprocal links including a Traditional Chinese script tag',async()=>sandbox(async root=>{
  const entries=[['/','en','en'],['/zh/','zh-CN','zh-CN'],['/jp/','ja','ja'],['/zh-hk/','zh-HK','zh-Hant-HK']];
  const alternate=entries.map(([path,lang])=>`<link rel="alternate" hreflang="${lang}" href="${origin}${path}">`).join('');
  for(const [path,,lang]of entries)await page(root,path,html(path,alternate,undefined,lang));
  await sitemap(root,entries.map(e=>e[0]));assert.equal((await auditSite(root,{origin})).issueCount,0);
  await page(root,'/jp/',html('/jp/','',undefined,'ja'));
  assert.ok((await auditSite(root,{origin})).issues.some(i=>i.code==='ALTERNATE_RETURN'));
}));
test('wrong target language, missing alternate and missing self are reported',async()=>sandbox(async root=>{
  await page(root,'/',html('/','<link rel="alternate" hreflang="ja" href="https://example.com/other/"><link rel="alternate" hreflang="zh-CN" href="https://example.com/missing/">'));
  await page(root,'/other/',html('/other/'));
  await sitemap(root,['/','/other/']);
  const codes=(await auditSite(root,{origin})).issues.map(i=>i.code);
  for(const code of ['ALTERNATE_LANGUAGE','ALTERNATE_MISSING','ALTERNATE_SELF'])assert.ok(codes.includes(code));
}));
test('canonical mismatch and malformed JSON-LD have specific diagnostics',async()=>sandbox(async root=>{
  await page(root,'/',html('/','<script type="application/ld+json">{bad}</script>').replace('href="https://example.com/"','href="https://example.com/other/"'));
  await sitemap(root,['/']);
  assert.deepEqual(new Set((await auditSite(root,{origin})).issues.map(i=>i.code)),new Set(['CANONICAL_WRONG','JSONLD_INVALID']));
}));
test('noindex pages are excluded from required sitemap entries and flagged if listed',async()=>sandbox(async root=>{
  await page(root,'/',html('/'));
  await page(root,'/private/',html('/private/','<meta name="robots" content="noindex, follow">'));
  await sitemap(root,['/']);assert.equal((await auditSite(root,{origin})).issueCount,0);
  await sitemap(root,['/','/private/','/missing/']);
  const codes=(await auditSite(root,{origin})).issues.map(i=>i.code);
  assert.ok(codes.includes('SITEMAP_NOINDEX'));assert.ok(codes.includes('SITEMAP_TARGET_MISSING'));
}));
test('root robots block and missing sitemap are visible in all report languages',async()=>sandbox(async root=>{
  await page(root,'/',html('/'));await writeFile(join(root,'robots.txt'),'User-agent: *\nDisallow: /\n');
  for(const language of ['en','zh-CN','ja','zh-HK']){
    const result=await auditSite(root,{origin,language});
    assert.equal(result.language,language);assert.equal(result.issueCount,2);
    assert.ok(result.issues.every(i=>i.message));
  }
}));
test('credentials in the origin and invalid CLI input are rejected',async()=>sandbox(async root=>{
  await page(root,'/',html('/'));
  await assert.rejects(auditSite(root,{origin:'https://user:secret@example.com'}));
  assert.equal(spawnSync(process.execPath,['check.mjs',root],{cwd:new URL('.',import.meta.url)}).status,2);
}));
test('wildcard robots groups respect an equal root Allow and consecutive agent names',async()=>sandbox(async root=>{
  await page(root,'/',html('/'));await sitemap(root,['/']);
  await writeFile(join(root,'robots.txt'),'User-agent: *\nUser-agent: ExampleBot\nDisallow: /\n');
  assert.ok((await auditSite(root,{origin})).issues.some(i=>i.code==='ROBOTS_ROOT_BLOCK'));
  await writeFile(join(root,'robots.txt'),'User-agent: *\nDisallow: /\nAllow: /\n');
  assert.equal((await auditSite(root,{origin})).issueCount,0);
}));
