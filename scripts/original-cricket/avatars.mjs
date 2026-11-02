// Original geometry and joint math. No downloaded models, textures or motion clips.
const avAdd=(a,b)=>a.map((v,i)=>v+b[i]),avSub=(a,b)=>a.map((v,i)=>v-b[i]),avScale=(a,s)=>a.map(v=>v*s),avDot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const avCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const avNorm=a=>avScale(a,1/(Math.hypot(...a)||1));
const avGauss=(x,y,cx,cy,wx,wy)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
export function solveAvatarJoint(start,target,upper,lower,pole=[0,0,1]){
 if(!(upper>0&&lower>0))throw Error('Positive bone lengths required');
 const delta=avSub(target,start),distance=Math.hypot(...delta),axis=distance>1e-8?avScale(delta,1/distance):[0,-1,0];
 const d=Math.max(Math.abs(upper-lower)+1e-6,Math.min(upper+lower-1e-6,distance));
 let bend=avSub(pole,avScale(axis,avDot(pole,axis)));
 if(Math.hypot(...bend)<1e-6){const fallback=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0];bend=avSub(fallback,avScale(axis,avDot(fallback,axis)));}
 bend=avNorm(bend);const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {joint:avAdd(start,avAdd(avScale(axis,along),avScale(bend,height))),end:avAdd(start,avScale(axis,d))};
}
export function avatarSurface(rows,columns,point,invert=false,periodic=true){
 const p=[],n=[],i=[];for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){p.push(...point(y/rows,x/columns));n.push(0,0,0);}
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+columns+1;i.push(...(invert?[a,b,a+1,a+1,b,b+1]:[a,a+1,b,a+1,b+1,b]));}
 for(let k=0;k<i.length;k+=3){const ids=i.slice(k,k+3),a=p.slice(ids[0]*3,ids[0]*3+3),b=p.slice(ids[1]*3,ids[1]*3+3),c=p.slice(ids[2]*3,ids[2]*3+3),normal=avCross(avSub(b,a),avSub(c,a));for(const index of ids)for(let j=0;j<3;j++)n[index*3+j]+=normal[j];}
 // The longitude seam is shared geometrically; average normals across it.
 if(periodic)for(let y=0;y<=rows;y++){const a=y*(columns+1)*3,b=a+columns*3;for(let j=0;j<3;j++){const v=n[a+j]+n[b+j];n[a+j]=v;n[b+j]=v;}}
 for(let k=0;k<n.length;k+=3){let unit=avNorm(n.slice(k,k+3));
  // Open lip corners collapse to a point: evaluate the nearby surface limit.
  if(Math.hypot(...unit)<.5){const index=k/3,u=Math.max(.001,Math.min(.999,Math.floor(index/(columns+1))/rows)),v=Math.max(.001,Math.min(.999,(index%(columns+1))/columns)),dv=avSub(point(u,v+.0001),point(u,v-.0001)),du=avSub(point(u+.0001,v),point(u-.0001,v));unit=avNorm(avScale(avCross(dv,du),invert?-1:1));}
  n.splice(k,3,...unit);}return {p,n,i};
}
export function avatarFaceProfile(variant=0){const v=((variant%6)+6)%6;return {width:.094+v*.002,jaw:.69+(v%3)*.055,nose:.027+(v%4)*.0025,brow:.005+(v%2)*.002};}
export function originalAvatarMeshes(){
 const result={};for(let variant=0;variant<6;variant++){
  const shape=avatarFaceProfile(variant);
  result['head'+variant]=avatarSurface(28,40,(u,v)=>{
   const lat=.015+u*(Math.PI-.03),angle=v*Math.PI*2,sy=Math.cos(lat),y=sy*.143,x=Math.sin(angle)*Math.sin(lat)*shape.width*(sy<-.25?shape.jaw+(sy+1)*.25:1),front=Math.max(0,Math.cos(angle));
   let z=Math.cos(angle)*Math.sin(lat)*.103;
   if(front>0){const nose=shape.nose*avGauss(x,y,0,-.008,.018,.039),bridge=.009*avGauss(x,y,0,.035,.014,.035),nostrils=.006*avGauss(x,y,0,-.026,.03,.01),eyes=-.012*(avGauss(x,y,-.038,.026,.025,.016)+avGauss(x,y,.038,.026,.025,.016)),brow=shape.brow*(avGauss(x,y,-.036,.05,.029,.012)+avGauss(x,y,.036,.05,.029,.012)),cheek=.008*(avGauss(x,y,-.057,-.008,.027,.03)+avGauss(x,y,.057,-.008,.027,.03)),mouth=.006*avGauss(x,y,0,-.064,.036,.01),chin=.007*avGauss(x,y,0,-.107,.032,.02);z+=(nose+bridge+nostrils+eyes+brow+cheek+mouth+chin)*front**3;}
   return [x,y,z];
  },true);
 }
 const profile=[[.84,.170,.118],[.92,.165,.116],[1.04,.147,.101],[1.17,.171,.115],[1.32,.205,.128],[1.43,.218,.119],[1.47,.192,.105],[1.52,.078,.068]];
 result.jersey=avatarSurface(30,32,(u,v)=>{const pos=u*(profile.length-1),index=Math.min(profile.length-2,Math.floor(pos)),f=pos-index,a=profile[index],b=profile[index+1],y=a[0]+(b[0]-a[0])*f,rx=a[1]+(b[1]-a[1])*f,rz=a[2]+(b[2]-a[2])*f,angle=v*Math.PI*2,fold=.0025*Math.sin(angle*9+y*43)*Math.sin(u*Math.PI);return [Math.sin(angle)*(rx+fold),y,Math.cos(angle)*(rz+fold)];});
 result.neck=avatarSurface(12,32,(u,v)=>{const a=v*Math.PI*2,r=.061+Math.max(0,.35-u)*.03;return [Math.sin(a)*r,1.46+u*.13,Math.cos(a)*r*.9];});
 result.helmet=avatarSurface(16,36,(u,v)=>{const a=.01+u*Math.PI/2,b=v*Math.PI*2;return [Math.sin(b)*Math.sin(a)*.125,Math.cos(a)*.154,Math.cos(b)*Math.sin(a)*.133];},true);
 result.hair=avatarSurface(14,32,(u,v)=>{const a=.01+u*Math.PI*.56,b=v*Math.PI*2,ripple=.0015*Math.sin(b*23+a*11);return [Math.sin(b)*Math.sin(a)*(.1+ripple),Math.cos(a)*.15,Math.cos(b)*Math.sin(a)*(.104+ripple)];},true);
 return result;
}
