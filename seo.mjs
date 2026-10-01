import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { messageFor, reportLanguages, summaries } from './messages.mjs';

function decode(value='') {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,entity=>{
    const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
    if(named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const code=entity.toLowerCase().startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
    return code>=0 && code<=0x10ffff?String.fromCodePoint(code):entity;
  });
}
function attrs(tag) {
  const result={};
  const body=tag.replace(/^<\/?[\w:-]+/,'').replace(/\/?\s*>$/,'');
  for(const match of body.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))result[match[1].toLowerCase()]=decode(match[2]??match[3]??match[4]??'');
  return result;
}
const cleanText = text=>decode(text.replace(/<[^>]*>/g,'')).replace(/\s+/g,' ').trim();
const pathForFile=file=>'/'+file.split(sep).join('/').replace(/(^|\/)index\.html?$/i,'$1');
const region=language=>language.split('-').find((part,i)=>i>0&&/^[a-z]{2}$/i.test(part))?.toLowerCase();
function languageMatches(a,b) {
  const aa=a.toLowerCase().split('-'),bb=b.toLowerCase().split('-');
  if(aa[0]!==bb[0])return false;
  const ar=region(a),br=region(b);
  if(ar&&br&&ar!==br)return false;
  const as=aa.find(part=>part.length===4),bs=bb.find(part=>part.length===4);
  return !(as&&bs&&as!==bs);
}
function parseHtml(html) {
  const original=html.replace(/<!--[\s\S]*?-->/g,'');
  const content=original.replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  const title=cleanText(content.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]||'');
  const metas=[...content.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const links=[...content.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
  const anchors=[...content.matchAll(/<a\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>'href' in a);
  const ids=new Set([...content.matchAll(/<[a-z][^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.id).map(a=>a.id));
  for(const a of [...content.matchAll(/<a\b[^>]*>/gi)].map(m=>attrs(m[0])))if(a.name)ids.add(a.name);
  const jsonLd=[...original.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].filter(m=>attrs('<script'+m[1]+'>').type?.toLowerCase()==='application/ld+json').map(m=>m[2]);
  return {title,description:metas.find(m=>m.name?.toLowerCase()==='description')?.content?.trim()||'',
    lang:attrs(content.match(/<html\b[^>]*>/i)?.[0]||'<html>').lang||'',
    noindex:metas.some(m=>['robots','googlebot'].includes(m.name?.toLowerCase())&&/(?:^|[\s,])noindex(?:$|[\s,])/i.test(m.content||'')),
    h1Count:[...content.matchAll(/<h1\b[^>]*>/gi)].length,
    canonicals:links.filter(l=>l.rel?.toLowerCase().split(/\s+/).includes('canonical')).map(l=>l.href||''),
    alternates:links.filter(l=>l.rel?.toLowerCase().split(/\s+/).includes('alternate')&&l.hreflang).map(l=>({language:l.hreflang.toLowerCase(),href:l.href||''})),
    anchors,ids,jsonLd};
}

export async function auditSite(directory, {origin, language='en'}={}) {
  if(!reportLanguages.includes(language))throw new Error('Unsupported report language');
  const base=new URL(origin);
  if(!['https:','http:'].includes(base.protocol)||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('Use an HTTP(S) origin without a path, query or credentials');
  origin=base.origin;
  const root=resolve(directory);
  if(!(await stat(root)).isDirectory())throw new Error('Input is not a directory');
  const files=new Set(),pages=new Map(),issues=[];
  async function walk(dir) {
    for(const item of await readdir(dir,{withFileTypes:true})) {
      if(item.isSymbolicLink()||item.name==='.git'||item.name==='node_modules')continue;
      const file=join(dir,item.name);
      if(item.isDirectory())await walk(file);
      else if(item.isFile()) {
        const relativePath=relative(root,file);
        files.add('/'+relativePath.split(sep).join('/'));
        if(/\.html?$/i.test(file)) {
          const path=pathForFile(relativePath);
          pages.set(path,{path,file:relativePath.split(sep).join('/'),...parseHtml(await readFile(file,'utf8'))});
        }
      }
    }
  }
  await walk(root);
  if(!pages.size)throw new Error('No HTML pages found');
  const canonicalUrl=path=>new URL(path,origin).href;
  const add=(page,code,details={})=>issues.push({page,code,message:messageFor(code,language),details});
  const pathOf=url=>decodeURIComponent(url.pathname);
  function existsPath(path){return pages.has(path)||files.has(path)||files.has(path+'index.html')||files.has(path+'index.htm');}
  const titleOwners=new Map(),descriptionOwners=new Map();
  for(const page of pages.values()) {
    if(!page.lang)add(page.path,'LANG_MISSING');
    if(!page.noindex) {
      if(!page.title)add(page.path,'TITLE_MISSING');
      else {
        const titleKey=page.title.toLowerCase();
        if(titleOwners.has(titleKey))add(page.path,'TITLE_DUPLICATE',{other:titleOwners.get(titleKey)});
        else titleOwners.set(titleKey,page.path);
      }
      if(!page.description)add(page.path,'DESCRIPTION_MISSING');
      else {
        const key=page.description.toLowerCase();
        if(descriptionOwners.has(key))add(page.path,'DESCRIPTION_DUPLICATE',{other:descriptionOwners.get(key)});
        else descriptionOwners.set(key,page.path);
      }
      if(page.h1Count!==1)add(page.path,'H1_COUNT',{count:page.h1Count});
      if(page.canonicals.length!==1||!/^https?:\/\//i.test(page.canonicals[0]))add(page.path,'CANONICAL_MISSING',{count:page.canonicals.length});
      else if(page.canonicals[0]!==canonicalUrl(page.path))add(page.path,'CANONICAL_WRONG',{actual:page.canonicals[0],expected:canonicalUrl(page.path)});
    }
    for(const raw of page.jsonLd) {try{JSON.parse(raw);}catch{add(page.path,'JSONLD_INVALID');}}
    for(const anchor of page.anchors) {
      let url;
      try{url=new URL(anchor.href,canonicalUrl(page.path));}catch{add(page.path,'INTERNAL_MISSING',{href:anchor.href});continue;}
      if(!['http:','https:'].includes(url.protocol)||url.origin!==origin)continue;
      let targetPath;
      try{targetPath=pathOf(url);}catch{add(page.path,'INTERNAL_MISSING',{href:anchor.href});continue;}
      if(!existsPath(targetPath)){add(page.path,'INTERNAL_MISSING',{href:anchor.href,target:targetPath});continue;}
      const target=pages.get(targetPath);
      if(url.hash&&target){
        let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{id=url.hash.slice(1);}
        if(!target.ids.has(id))add(page.path,'FRAGMENT_MISSING',{href:anchor.href});
      }
    }
    if(page.alternates.length) {
      const languages=new Set();let hasSelf=false;
      for(const alternate of page.alternates) {
        if(languages.has(alternate.language))add(page.path,'ALTERNATE_DUPLICATE',{language:alternate.language});
        languages.add(alternate.language);
        let url;
        try {url=new URL(alternate.href);if(!['http:','https:'].includes(url.protocol)||url.search||url.hash||url.username||url.password)throw new Error();}
        catch{add(page.path,'ALTERNATE_INVALID',alternate);continue;}
        if(url.origin!==origin){add(page.path,'ALTERNATE_INVALID',{...alternate,external:true});continue;}
        let targetPath;try{targetPath=pathOf(url);}catch{add(page.path,'ALTERNATE_INVALID',alternate);continue;}
        const target=pages.get(targetPath);
        if(!target){add(page.path,'ALTERNATE_MISSING',alternate);continue;}
        if(target.noindex)add(page.path,'ALTERNATE_NOINDEX',alternate);
        if(alternate.language==='x-default')continue;
        if(!target.lang||!languageMatches(alternate.language,target.lang))add(page.path,'ALTERNATE_LANGUAGE',{...alternate,targetLanguage:target.lang});
        if(targetPath===page.path&&languageMatches(alternate.language,page.lang))hasSelf=true;
        if(!target.alternates.some(back=>back.href===canonicalUrl(page.path)&&languageMatches(back.language,page.lang)))add(page.path,'ALTERNATE_RETURN',{target:alternate.href});
      }
      if(!hasSelf)add(page.path,'ALTERNATE_SELF');
    }
  }
  const sitemapPath=join(root,'sitemap.xml');
  let sitemap;
  try{sitemap=await readFile(sitemapPath,'utf8');}
  catch(error){if(error.code==='ENOENT')add('/sitemap.xml','SITEMAP_MISSING');else throw error;}
  if(sitemap!==undefined){
    const sitemapUrls=new Set([...sitemap.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map(m=>decode(m[1].trim())));
    for(const value of sitemapUrls){
      let url;try{url=new URL(value);if(url.origin!==origin||url.search||url.hash||url.username||url.password)throw new Error();}catch{add('/sitemap.xml','SITEMAP_INVALID',{url:value});continue;}
      let path;try{path=pathOf(url);}catch{add('/sitemap.xml','SITEMAP_INVALID',{url:value});continue;}
      if(!pages.has(path))add('/sitemap.xml','SITEMAP_TARGET_MISSING',{url:value});
      else if(pages.get(path).noindex)add('/sitemap.xml','SITEMAP_NOINDEX',{url:value});
    }
    for(const page of pages.values())if(!page.noindex&&!sitemapUrls.has(canonicalUrl(page.path)))add(page.path,'SITEMAP_PAGE_MISSING');
  }
  const robots=await readFile(join(root,'robots.txt'),'utf8').catch(error=>{if(error.code==='ENOENT')return '';throw error;});
  // Deliberately limited to wildcard groups and exact root directives.
  const groups=[];let group={agents:[],rules:[]};
  for(const line of robots.split(/\r?\n/).map(line=>line.split('#')[0].trim()).filter(Boolean)){
    if(/^User-agent\s*:/i.test(line)){
      if(group.rules.length){groups.push(group);group={agents:[],rules:[]};}
      group.agents.push(line.replace(/^User-agent\s*:\s*/i,'').toLowerCase());
    }else if(/^(Allow|Disallow)\s*:/i.test(line)){
      const [,action,path]=line.match(/^(Allow|Disallow)\s*:\s*(.*)$/i);
      group.rules.push({action:action.toLowerCase(),path});
    }
  }
  groups.push(group);
  const rootRules=groups.filter(group=>group.agents.includes('*')).flatMap(group=>group.rules).filter(rule=>rule.path==='/');
  if(rootRules.some(rule=>rule.action==='disallow')&&!rootRules.some(rule=>rule.action==='allow'))add('/robots.txt','ROBOTS_ROOT_BLOCK');
  return {schemaVersion:1,language,origin,pagesChecked:pages.size,indexablePages:[...pages.values()].filter(p=>!p.noindex).length,
    issueCount:issues.length,summary:issues.length?`${summaries[language][0]}: ${pages.size}; ${summaries[language][1]}: ${issues.length}`:summaries[language][2],issues};
}
