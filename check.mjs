import { auditSite } from './seo.mjs';
import { reportLanguages } from './messages.mjs';
const args=process.argv.slice(2);
const requestedLanguage=args[args.indexOf('--lang')+1];
const language=reportLanguages.includes(requestedLanguage)?requestedLanguage:'en';
const inputErrors={
  en:'Cannot inspect the export. Check the directory, use an HTTP(S) origin without a path, query or credentials, and choose a supported report language.',
  'zh-CN':'无法检查导出目录。请确认目录存在；源站地址只包含 HTTP(S) 协议和域名，不包含路径、查询参数或凭据；报告语言必须受支持。',
  ja:'出力先を検査できません。ディレクトリの存在を確認し、パス・クエリ・認証情報を含まない HTTP(S) のオリジンと対応言語を指定してください。',
  'zh-HK':'無法檢查匯出目錄。請確認目錄存在；來源站點只包含 HTTP(S) 協定及網域，不包含路徑、查詢參數或憑證；報告語言必須受支援。'
};
try {
  const directory=args.shift();
  if(!directory||args.length%2||args.some((arg,i)=>i%2===0&&!['--origin','--lang'].includes(arg)))throw new Error('Usage: node check.mjs DIRECTORY --origin https://example.com [--lang en|zh-CN|ja|zh-HK]');
  const flags=Object.fromEntries(Array.from({length:args.length/2},(_,i)=>[args[i*2].slice(2),args[i*2+1]]));
  if(!flags.origin||!reportLanguages.includes(flags.lang||'en'))throw new Error('Provide --origin and a supported --lang');
  const report=await auditSite(directory,{origin:flags.origin,language:flags.lang||'en'});
  console.log(JSON.stringify(report,null,2));
  process.exitCode=report.issueCount?1:0;
}catch(error){
  console.error(inputErrors[language]);
  console.error('node check.mjs DIRECTORY --origin https://example.com --lang '+language);
  process.exitCode=2;
}
