import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),publicDir:'../public',plugins:[react()],css:{postcss:{plugins:[tailwind()]}},resolve:{alias:{'@':fileURLToPath(new URL('..',import.meta.url))}},build:{outDir:'../work/mobile-web',emptyOutDir:true,target:'es2022'}});
