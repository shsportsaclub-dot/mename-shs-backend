import {cricketBodyPoint} from './motion.mjs';
const skinAdd=(a,b)=>a.map((x,i)=>x+b[i]),skinSub=(a,b)=>a.map((x,i)=>x-b[i]),skinMul=(a,s)=>a.map(x=>x*s),skinCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],skinUnit=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
function cricketSurfaceNormals(p,indices){const n=new Array(p.length).fill(0);for(let k=0;k<indices.length;k+=3){const ids=indices.slice(k,k+3),a=p.slice(ids[0]*3,ids[0]*3+3),b=p.slice(ids[1]*3,ids[1]*3+3),c=p.slice(ids[2]*3,ids[2]*3+3),v=skinCross(skinSub(b,a),skinSub(c,a));for(const id of ids)for(let j=0;j<3;j++)n[id*3+j]+=v[j];}for(let k=0;k<n.length;k+=3){let v=skinUnit(n.slice(k,k+3));if(Math.hypot(...v)<.5)v=[0,1,0];n.splice(k,3,...v);}return n;}
export function deformCricketTorso(bind,motion){const p=[];for(let i=0;i<bind.p.length;i+=3)p.push(...cricketBodyPoint(bind.p.slice(i,i+3),motion));return {p,n:cricketSurfaceNormals(p,bind.i),i:bind.i};}
export function originalCricketLimb(a,b,c,kind='arm'){
 const p=[],i=[],columns=16,rows=14,upper=skinUnit(skinSub(b,a)),lower=skinUnit(skinSub(c,b));
 const profile=kind==='leg'?[[.083,.091],[.072,.075],[.061,.064],[.065,.062],[.043,.047]]:[[.050,.047],[.047,.046],[.040,.039],[.041,.036],[.026,.024]];
 for(let row=0;row<=rows;row++){
  const u=row/rows,first=u<=.5,center=first?skinAdd(a,skinMul(skinSub(b,a),u*2)):skinAdd(b,skinMul(skinSub(c,b),(u-.5)*2));
  const blend=Math.max(0,Math.min(1,(u-.35)/.3)),tangent=skinUnit(skinAdd(skinMul(upper,1-blend),skinMul(lower,blend))),x=skinUnit(skinCross(Math.abs(tangent[2])<.9?[0,0,1]:[1,0,0],tangent)),z=skinCross(tangent,x),at=u*(profile.length-1),n=Math.min(profile.length-2,Math.floor(at)),f=at-n,rx=profile[n][0]+(profile[n+1][0]-profile[n][0])*f,rz=profile[n][1]+(profile[n+1][1]-profile[n][1])*f;
  for(let col=0;col<=columns;col++){const angle=col/columns*Math.PI*2;p.push(...skinAdd(center,skinAdd(skinMul(x,Math.cos(angle)*rx),skinMul(z,Math.sin(angle)*rz))));}
 }
 for(let r=0;r<rows;r++)for(let col=0;col<columns;col++){const a=r*(columns+1)+col,b=a+columns+1;i.push(a,a+1,b,a+1,b+1,b);}
 return {p,n:cricketSurfaceNormals(p,i),i};
}
