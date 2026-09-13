import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
import {readdir,readFile,unlink,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
async function compactAssets(dir:string,root=dir){
 const files=await readdir(dir,{withFileTypes:true});
 for(const file of files){
  const path=join(dir,file.name);
  if(file.isDirectory()){await compactAssets(path,root);continue;}
  if(!/\.(?:js|css|html)$/.test(file.name))continue;
  let text=await readFile(path,'utf8');
  const refs=[...text.matchAll(/\/images\/[^"'`()\s,]+\.(?:png|jpe?g)/gi)].map(m=>m[0]);
  for(const ref of new Set(refs)){
   const webp=ref.replace(/\.(?:png|jpe?g)$/i,'.webp');
   try{await readFile(join(root,webp.replace(/^\//,'')));text=text.split(ref).join(webp);}catch{}
  }
  await writeFile(path,text);
 }
 for(const file of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,file.name);
  if(file.isDirectory()){await compactAssets(path,root);continue;}
  if(/\.(?:png|jpe?g)$/i.test(file.name)){const webp=path.replace(/\.(?:png|jpe?g)$/i,'.webp');try{await readFile(webp);await unlink(path);}catch{}}
 }
}
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:'../public',plugins:[react(),{name:'compact-mobile-images',async closeBundle(){await compactAssets(fileURLToPath(new URL('../work/mobile-web',import.meta.url)));}}],css:{postcss:{plugins:[tailwind()]}},resolve:{alias:{'@':fileURLToPath(new URL('..',import.meta.url))}},build:{outDir:'../work/mobile-web',emptyOutDir:true,target:'es2022'}});
