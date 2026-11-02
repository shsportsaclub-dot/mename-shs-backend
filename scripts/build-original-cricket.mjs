import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const plain=s=>s.replace(/export (function|class) /g,'$1 ');
const core=plain(read('scripts/original-cricket/core.mjs'));
const hybrid=plain(read('scripts/original-cricket/hybrid.mjs'));
const chase=plain(read('scripts/original-cricket/boundary-chase.mjs'));
const camera=plain(read('scripts/original-cricket/camera.mjs'));
const presentation=plain(read('scripts/original-cricket/presentation.mjs'));
const avatars=plain(read('scripts/original-cricket/avatars.mjs'));
const avatarModel=plain(read('scripts/original-cricket/avatar-model.mjs'));
const humanHeadFit=plain(read('scripts/original-cricket/human-head-fit.mjs').replace(/^import .*;\n/gm,''));
const humanHeadData=plain(read('scripts/original-cricket/anatomical-head.mjs'));
const avatarStudy=plain(read('scripts/original-cricket/avatar-study.mjs').replace(/^import .*;\n/gm,''));
const expressions=plain(read('scripts/original-cricket/expressions.mjs'));
const equipment=plain(read('scripts/original-cricket/equipment.mjs'));
const motion=plain(read('scripts/original-cricket/motion.mjs').replace(/^import .*;\n/gm,''));
const motionSkin=plain(read('scripts/original-cricket/motion-skin.mjs').replace(/^import .*;\n/gm,''));
const scenery=plain(read('scripts/original-cricket/stadium.mjs'));
const broadcast=plain(read('scripts/original-cricket/broadcast.mjs'))+'\n'+read('scripts/original-cricket/broadcast-ui.js');
const post=read('scripts/original-cricket/portrait-post.js');
const runtime=read('scripts/original-cricket/runtime.js')+'\n'+read('scripts/original-cricket/avatar-model-runtime.js');
const feed=plain(read('virtual-live-feed.mjs').replace(/^import .*;\n/gm,''));
const studio='const HYBRID_TRACKER_WORKER='+JSON.stringify(read('scripts/original-cricket/hybrid-worker.js'))+';\n'+read('scripts/original-cricket/hybrid-studio.js');
const connect=read('scripts/original-cricket/connect.js');
const script=core+'\n'+hybrid+'\n'+chase+'\n'+camera+'\n'+presentation+'\n'+avatars+'\n'+humanHeadFit+'\n'+avatarStudy+'\n'+avatarModel+'\n'+expressions+'\n'+equipment+'\n'+motion+'\n'+motionSkin+'\n'+scenery+'\n'+broadcast+'\n'+post+'\n'+runtime+'\n'+feed+'\n'+connect+'\n'+studio;
new vm.Script(script,{filename:'original-virtual-live.html'});
const html=read('scripts/original-cricket/template.html').replace('/*__CORE__*/',core).replace('/*__RUNTIME__*/',hybrid+'\n'+chase+'\n'+camera+'\n'+presentation+'\n'+avatars+'\n'+humanHeadFit+'\n'+avatarStudy+'\n'+avatarModel+'\n'+expressions+'\n'+equipment+'\n'+motion+'\n'+motionSkin+'\n'+scenery+'\n'+broadcast+'\n'+post+'\n'+runtime+'\n'+feed+'\n'+connect+'\n'+studio);
fs.writeFileSync(new URL('../public/original-virtual-live.html',import.meta.url),html);

// The one-character asset study has no source tracker or scorer adapter.
const avatarScript='window.SH_AVATAR_STUDY=true;\n'+humanHeadData+'\n'+core+'\n'+hybrid+'\n'+chase+'\n'+camera+'\n'+presentation+'\n'+avatars+'\n'+humanHeadFit+'\n'+avatarStudy+'\n'+avatarModel+'\n'+expressions+'\n'+equipment+'\n'+motion+'\n'+motionSkin+'\n'+scenery+'\n'+broadcast+'\n'+post+'\n'+runtime+'\n'+read('scripts/original-cricket/avatar-study-ui.js');
new vm.Script(avatarScript,{filename:'original-avatar.html'});
const avatarHtml=read('scripts/original-cricket/template.html').replace('/*__CORE__*/',avatarScript).replace('/*__RUNTIME__*/','').replace('</head>',read('scripts/original-cricket/avatar-study-style.html')+'</head>').replace(/<title>[^<]*<\/title>/,'<title>Scoring Heroes · One Original Avatar</title>');
fs.writeFileSync(new URL('../public/original-avatar.html',import.meta.url),avatarHtml);

const jsonViewer=avatarHtml.replace(humanHeadData+'\n','').replace('window.SH_AVATAR_STUDY=true;','window.SH_AVATAR_STUDY=true;window.SH_AVATAR_JSON_ONLY=true;').replace('One Original Avatar</title>','JSON Avatar Viewer</title>');
fs.writeFileSync(new URL('../public/original-avatar-json.html',import.meta.url),jsonViewer);
