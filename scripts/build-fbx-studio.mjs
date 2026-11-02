import {build} from 'esbuild';
import fs from 'node:fs';
const r=await build({entryPoints:['scripts/fbx-studio/studio.mjs'],bundle:true,minify:true,format:'iife',write:false,legalComments:'inline'});
const html=fs.readFileSync('scripts/fbx-studio/page.html','utf8').replace('/*STUDIO_BUNDLE*/',()=>r.outputFiles[0].text.replaceAll('</script','<\\/script'));
fs.writeFileSync('public/fbx-motion-studio.html',html);
console.log('FBX studio built: '+html.length+' bytes');
