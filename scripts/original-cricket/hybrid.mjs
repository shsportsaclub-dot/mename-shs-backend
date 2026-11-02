// Original fusion/retargeting logic. Vision estimates are not measured field or ball tracking.
export function parseCricketCaption(value){
 const text=String(value??'').replace(/[\u0000-\u0008]/g,'').trim().slice(0,1000),s=text.toLowerCase();
 const regions=[['THIRD_MAN',/third man|థర్డ్ మ్యాన్/],['FINE_LEG',/fine leg|ఫైన్ లెగ్/],['MIDWICKET',/mid[ -]?wicket|మిడ్ వికెట్/],['LONG_ON',/long[ -]?on|లాంగ్ ఆన్/],['LONG_OFF',/long[ -]?off|లాంగ్ ఆఫ్/],['COVER',/cover|కవర్|कवर/],['POINT',/point|పాయింట్/],['STRAIGHT',/straight|స్ట్రెయిట్/]];
 const region=regions.find(([,re])=>re.test(s))?.[0]??null;
 const uncertain=/\b(not out|no[ -]?ball|needed|need|requires?|if|might|could|nearly|almost)\b|కావాలి|నాట్ అవుట్|चाहिए/.test(s);
 let resultHint=null;if(!uncertain){if(/\bsix\b|సిక్స్|छक्का/.test(s))resultHint='SIX';else if(/\bfour\b|ఫోర్|చౌకా|चौका/.test(s))resultHint='FOUR';else if(/\b(bowled|caught|out)\b|అవుట్|आउट/.test(s))resultHint='WICKET';}
 const phase=resultHint?'result':/\bruns? in\b|\brun[ -]?up\b|బౌలింగ్/.test(s)?'delivery':region||/\b(driv|pull|cut|shot|hit)/.test(s)?'shot':null;
 return {text,region,phase,resultHint,authority:'COMMENTARY_HINT_ONLY'};
}
export function parseHybridVtt(value){
 const text=String(value).replace(/^\uFEFF/,'').replace(/\r/g,'');if(!/^WEBVTT(?:\s|$)/.test(text))throw Error('Expected a WEBVTT caption file');
 const stamp=s=>{const m=s.match(/^(?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})$/);if(!m||+m[2]>59||+m[3]>59)return NaN;return (+m[1]||0)*3600+(+m[2])*60+(+m[3])+(+m[4])/1000;};
 const cues=[];for(const block of text.split(/\n\s*\n/).slice(1)){const lines=block.split('\n'),at=lines.findIndex(l=>l.includes('-->'));if(at<0)continue;const parts=lines[at].trim().split(/\s+-->\s+/),start=stamp(parts[0]),end=stamp(parts[1]?.split(/\s/)[0]||'');if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;const content=lines.slice(at+1).join(' ').replace(/<[^>]*>/g,'').trim().slice(0,1000);if(content)cues.push({start,end,text:content});if(cues.length>=20000)break;}
 return cues.sort((a,b)=>a.start-b.start);
}
export function hybridCaptionAt(cues,time){return cues.filter(c=>c.start<=time&&time<c.end).map(c=>c.text).join(' · ').slice(0,1000);}
export function retargetCricketPose(points){
 if(!Array.isArray(points)||points.length!==33)return null;
 const visible=p=>p&&[p.x,p.y,p.z].every(Number.isFinite)&&Number.isFinite(p.visibility)&&p.visibility>=.55;
 if(![11,12,23,24].every(i=>visible(points[i])))return null;
 const vec=(a,b)=>{const d=[-(b.x-a.x),-(b.y-a.y),-(b.z-a.z)],l=Math.hypot(...d);return l>=.055&&l<=1.1?d.map(x=>x/l||0):null;};
 const limb=ids=>{if(!ids.every(i=>visible(points[i])))return null;const upper=vec(points[ids[0]],points[ids[1]]),lower=vec(points[ids[1]],points[ids[2]]);return upper&&lower?{upper,lower}:null;};
 const p={leftArm:limb([11,13,15]),rightArm:limb([12,14,16]),leftLeg:limb([23,25,27]),rightLeg:limb([24,26,28])};
 return p.leftArm||p.rightArm?{...p,confidence:Math.min(...[11,12,23,24].map(i=>points[i].visibility))}:null;
}
export class HybridPoseBuffer{
 constructor(){this.frames=[];}
 reset(){this.frames=[];}
 push(time,pose,wallTime=globalThis.performance?.now?.()??Date.now()){if(!Number.isFinite(time)||time<0||!pose||time<=(this.frames.at(-1)?.time??-1))return false;this.frames.push({time,pose,wallTime});if(this.frames.length>60)this.frames.shift();return true;}
 sample(time,wallTime=globalThis.performance?.now?.()??Date.now()){if(!Number.isFinite(time))return null;for(let i=this.frames.length-1;i>=0;i--){const f=this.frames[i];if(f.time<=time)return time-f.time<=.35&&wallTime-f.wallTime<=500?f.pose:null;}return null;}
}
