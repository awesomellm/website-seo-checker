import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function createFixtures(output='examples') {
  const root=resolve(output);
  for(const [name,invalid] of [['valid',false],['invalid',true]]){
    const dir=join(root,name);await mkdir(dir,{recursive:true});
    const title=invalid?'':'Example supplier';
    const description=invalid?'':'Fictional product and contact information for a supplier.';
    await writeFile(join(dir,'index.html'),`<!doctype html><html lang="en"><head><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="https://example.com/"></head><body><h1>Example</h1>${invalid?'<h1>Extra heading</h1><a href="/missing/">Missing page</a>':'<a href="#contact">Contact</a>'}<section id="contact">Example contact information</section></body></html>`);
    await writeFile(join(dir,'sitemap.xml'),`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>`);
  }
  return root;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await createFixtures(process.argv[2]));
