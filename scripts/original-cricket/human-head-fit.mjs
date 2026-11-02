import {anatomicalHeadData} from './anatomical-head.mjs';
import {avatarSurface} from './avatars.mjs';
let humanHeadCache=null,humanHeadGrid=null;
export function nativeStudyHead(){
 if(typeof anatomicalHeadData!=='function')return null;
 if(!humanHeadCache)humanHeadCache=anatomicalHeadData();return humanHeadCache;
}
export function nativeFacePoint(x,y){
 const head=nativeStudyHead();if(!head)return null;
 const cell=.008,key=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell);
 if(!humanHeadGrid){humanHeadGrid=new Map();for(let k=0;k<head.i.length;k+=3){const ids=head.i.slice(k,k+3),xs=ids.map(i=>head.p[i*3]),ys=ids.map(i=>head.p[i*3+1]);for(let a=Math.floor(Math.min(...xs)/cell);a<=Math.floor(Math.max(...xs)/cell);a++)for(let b=Math.floor(Math.min(...ys)/cell);b<=Math.floor(Math.max(...ys)/cell);b++){const id=a+','+b;if(!humanHeadGrid.has(id))humanHeadGrid.set(id,[]);humanHeadGrid.get(id).push(ids);}}}
 let z=-Infinity;for(const ids of humanHeadGrid.get(key(x,y))??[]){const [a,b,c]=ids.map(i=>head.p.slice(i*3,i*3+3)),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-14)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)z=Math.max(z,u*a[2]+v*b[2]+(1-u-v)*c[2]);}
 return [x,y,Number.isFinite(z)?z:0];
}
export function nativeStudyMeshes(){
 const head=nativeStudyHead();if(!head)return {};
 const out={},hair={p:head.p.slice(),n:head.n.slice(),i:[]};
 for(let k=0;k<hair.p.length;k+=3){for(let j=0;j<3;j++)hair.p[k+j]+=head.n[k+j]*.003;const x=head.p[k],y=head.p[k+1],z=head.p[k+2],root=Math.max(0,Math.min(1,(y-.090)/.05)),front=Math.max(0,Math.min(1,(z-.015)/.065)),quiff=root*front*Math.exp(-(((x+.015)/.085)**2));hair.p[k]+=.008*quiff;hair.p[k+1]+=.027*quiff;hair.p[k+2]+=.006*quiff+.002*Math.sin(x*140+y*18)*quiff;}
 for(let k=0;k<head.i.length;k+=3){const ids=head.i.slice(k,k+3);if(ids.every(i=>{const y=head.p[i*3+1],z=head.p[i*3+2],x=head.p[i*3];return y>(z>.015?.091+.005*Math.sin(x*38):.035);}))hair.i.push(...ids);}
 const used=[...new Set(hair.i)],remap=new Map(used.map((v,i)=>[v,i])),scalp={p:used.flatMap(i=>hair.p.slice(i*3,i*3+3)),n:new Array(used.length*3).fill(0),i:hair.i.map(i=>remap.get(i))};
 for(let k=0;k<scalp.i.length;k+=3){const ids=scalp.i.slice(k,k+3),[a,b,c]=ids.map(i=>scalp.p.slice(i*3,i*3+3)),u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const id of ids)for(let j=0;j<3;j++)scalp.n[id*3+j]+=n[j];}
 for(let i=0;i<scalp.n.length;i+=3){const length=Math.hypot(...scalp.n.slice(i,i+3));for(let j=0;j<3;j++)scalp.n[i+j]=length>1e-12?scalp.n[i+j]/length:head.n[used[i/3]*3+j];}
 out.studyNativeHair=scalp;
 for(const [side,name]of [[-1,'Left'],[1,'Right']]){
  const cx=side*.034468,cy=.026538,cz=.083442,r=.0167;
  const eye=avatarSurface(28,40,(u,v)=>{const lat=.001+u*(Math.PI-.002),a=v*Math.PI*2;return [cx+r*Math.sin(lat)*Math.sin(a),cy+r*Math.cos(lat),cz+r*Math.sin(lat)*Math.cos(a)];},true);
  eye.l=eye.p.map((x,i)=>i%3===0?x-cx+side*.034:i%3===1?x-cy+.027:x);out['studyNativeEye'+name]=eye;
  out['studyNativeBrow'+name]=avatarSurface(8,48,(u,v)=>{const x=side*(.016+v*.040),y=.049+.004*Math.sin(v*Math.PI)-v*.001+u*(.0058-v*.003),p=nativeFacePoint(x,y);p[2]+=.0012;return p;},side<0,false);
 }
 return out;
}
