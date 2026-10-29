import {mkdir,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const root='public/document-reader';await mkdir(root,{recursive:true});
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs',path.join(root,'pdf.worker.min.mjs'));
await copyFile('node_modules/tesseract.js/dist/worker.min.js',path.join(root,'worker.min.js'));
for(const file of await readdir('node_modules/tesseract.js-core'))if(/\.wasm(?:\.js)?$/.test(file))await copyFile('node_modules/tesseract.js-core/'+file,path.join(root,file));
for(const lang of ['kor','eng'])await copyFile(`node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,path.join(root,lang+'.traineddata.gz'));
for(const dir of ['cmaps','standard_fonts']){await mkdir(path.join(root,dir),{recursive:true});for(const file of await readdir('node_modules/pdfjs-dist/'+dir))await copyFile('node_modules/pdfjs-dist/'+dir+'/'+file,path.join(root,dir,file));}
for(const [pkg,name]of [['pdfjs-dist','pdfjs'],['tesseract.js','tesseract'],['tesseract.js-core','tesseract-core']]){for(const file of ['LICENSE','LICENSE.md','LICENSE.txt']){try{await copyFile('node_modules/'+pkg+'/'+file,path.join(root,name+'-LICENSE.txt'));break;}catch{}}}
