// Joins the two recordings into one 1080x1920 vertical MP4: broadcast on top, the real scorer screen below,
// and the scorer goes full screen while the wicket sheet is open.
const fs=require('fs'),cp=require('child_process'),glob=d=>fs.readdirSync(d).filter(f=>f.endsWith('.webm')).map(f=>d+'/'+f)[0];
const TL=JSON.parse(fs.readFileSync('/tmp/claude-0/ec/dm/scorer/timeline.json','utf8')),BC=JSON.parse(fs.readFileSync('/tmp/claude-0/ec/dm/bc/bc.json','utf8'));
const PRE=BC.pre||0,L=4,sv=glob('/tmp/claude-0/ec/dm/scorer'),bv=glob('/tmp/claude-0/ec/dm/bc'),out=process.argv[2]||'/tmp/claude-0/ec/dm/scoring-heroes-demo.mp4';
const win=[];let on=null;for(const w of TL.wk){if(w.on)on=w.t;else if(on!=null){win.push([on+L+PRE-.2,w.t+L+PRE+.4]);on=null}}
const en=win.length?win.map(([a,b])=>`between(t\\,${a.toFixed(2)}\\,${b.toFixed(2)})`).join('+'):'0';
const dur=TL.end+L+22+PRE;
const f=`[0:v]scale=1080:1116,setsar=1[top];[2:v]fps=25,setsar=1[pp];[1:v]fps=25,setsar=1[sq];[pp][sq]concat=n=2:v=1:a=0,tpad=stop_mode=clone:stop_duration=25,split=2[s1][s2];[s1]crop=540:402:0:0,scale=1080:804,setsar=1[bot];[top][bot]vstack=inputs=2[base];[s2]scale=1080:1920,setsar=1[full];[base][full]overlay=0:0:enable='${en}'[v]`;
cp.execFileSync('ffmpeg',['-y','-v','error','-ss',(TL.m0+1).toFixed(2),'-i',sv,'-frames:v','1','/tmp/claude-0/ec/dm/pre_still.png']);
const args=['-y','-ss',(BC.m0-L-PRE).toFixed(2),'-i',bv,'-ss',(TL.m0-L).toFixed(2),'-i',sv,'-loop','1','-t',Math.max(PRE,.1).toFixed(2),'-i','/tmp/claude-0/ec/dm/pre_still.png','-t',dur.toFixed(1),'-filter_complex',f,'-map','[v]','-r','25','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',out];
console.log('wicket windows',win.length,'duration',dur.toFixed(0)+'s');
cp.execFileSync('ffmpeg',args,{stdio:'inherit'});console.log('wrote',out);
