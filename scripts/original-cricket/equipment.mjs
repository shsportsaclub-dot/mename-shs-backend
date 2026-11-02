// Metres throughout (the existing pitch is 20.12 m long).
// Bounds: MCC 2026 Laws 4.1 (Size 1) and 5.7. Dimensions below are our
// selected model sizes within those bounds, not mandatory sizes for every bat.
const gearAdd=(a,b)=>a.map((v,i)=>v+b[i]),gearSub=(a,b)=>a.map((v,i)=>v-b[i]),gearMul=(a,s)=>a.map(v=>v*s),gearDot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),gearCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const gearUnit=(a,fallback=[0,-1,0])=>Math.hypot(...a)>1e-8?gearMul(a,1/Math.hypot(...a)):fallback;
export function cricketEquipment(height=1.85){
 if(!Number.isFinite(height)||height<1||height>2.3)throw Error('Player height must be 1–2.3 metres');
 const scale=Math.max(.78,Math.min(1.05,height/1.85));
 return {units:'metres',ballSize:1,ballRadius:.2265/(2*Math.PI),ballCircumference:.2265,batLength:.86*scale,handleLength:.25*scale,bladeLength:.61*scale,bladeWidth:Math.min(.108,.104*scale),bladeDepth:.035*scale,handleRadius:.0155*scale,handWidth:.078*scale,gripSpacing:.084*scale};
}
export function bowlingHandTarget(t){const a=Math.max(-.45,Math.min(.6,t-2))*Math.PI*2.4;return [.25,1.38+Math.cos(a)*.58,Math.sin(a)*.58];}
export function fitBatToHands({grip,tip,height=1.85,hand='RIGHT',oneHand=false}){
 const equipment=cricketEquipment(height),h=height/1.85,local={};for(const key of ['batLength','handleLength','bladeLength','bladeWidth','bladeDepth','handleRadius','gripSpacing'])local[key]=equipment[key]/h;
 const axis=gearUnit(gearSub(tip,grip)),preferred=[0,0,1];let front=gearSub(preferred,gearMul(axis,gearDot(axis,preferred)));if(Math.hypot(...front)<1e-5)front=gearSub([0,1,0],gearMul(axis,axis[1]));front=gearUnit(front);const side=gearUnit(gearCross(front,axis));
 const palmOffset=local.handleRadius+.010,order=hand==='LEFT'?1:-1,offsets=oneHand?[null,0]:[order*local.gripSpacing/2,-order*local.gripSpacing/2];let center=grip.slice();
 const targets=()=>offsets.map(x=>x===null?null:gearAdd(center,gearAdd(gearMul(axis,x),gearMul(front,palmOffset))));
 // Project the shared grip into both arm reach spheres. Both palms remain on
 // the same handle, rather than independently clamping and leaving it floating.
 for(let iteration=0;iteration<32;iteration++)for(let i=0;i<2;i++){
  const target=targets()[i];if(!target)continue;const shoulder=[i?.205:-.205,1.32,0],delta=gearSub(target,shoulder),length=Math.hypot(...delta),reach=.659;
  if(length>reach)center=gearAdd(center,gearMul(delta,reach/length-1));
 }
 const palms=targets(),butt=gearSub(center,gearMul(axis,local.handleLength*.44)),bladeStart=gearAdd(butt,gearMul(axis,local.handleLength)),toe=gearAdd(butt,gearMul(axis,local.batLength)),bladeCenter=gearAdd(bladeStart,gearMul(axis,local.bladeLength*.6));
 return {equipment,local,axis,front,side,grip:center,palms,palmOffset,butt,bladeStart,toe,bladeCenter,contact:gearAdd(bladeCenter,gearMul(front,local.bladeDepth/2+equipment.ballRadius/h))};
}
export function originalBatBladeMesh(){
 const rows=[[0,.42,.65],[.07,.75,.83],[.17,1,1],[.88,1,1],[1,.93,.78]],cross=[[-1,-.8],[-.8,-1],[.8,-1],[1,-.8],[1,.8],[.8,1],[-.8,1],[-1,.8]],p=[],n=[],i=[];
 for(const [y,w,d]of rows)for(const [x,z]of cross){p.push(x*d,y,z*w);n.push(0,0,0);}
 for(let row=0;row<rows.length-1;row++)for(let k=0;k<8;k++){const a=row*8+k,b=row*8+(k+1)%8;i.push(a,b,a+8,b,b+8,a+8);}
 for(let k=1;k<7;k++){i.push(0,k+1,k);const a=(rows.length-1)*8;i.push(a,a+k,a+k+1);}
 for(let k=0;k<i.length;k+=3){[i[k+1],i[k+2]]=[i[k+2],i[k+1]];}
 for(let k=0;k<i.length;k+=3){const ids=i.slice(k,k+3),a=p.slice(ids[0]*3,ids[0]*3+3),b=p.slice(ids[1]*3,ids[1]*3+3),c=p.slice(ids[2]*3,ids[2]*3+3),normal=gearCross(gearSub(b,a),gearSub(c,a));for(const id of ids)for(let j=0;j<3;j++)n[id*3+j]+=normal[j];}
 for(let k=0;k<n.length;k+=3)n.splice(k,3,...gearUnit(n.slice(k,k+3)));
 return {p,n,i};
}
