/* SH original athlete body: a smooth, anatomically proportioned character mesh built in code (no downloaded assets), skinned to the Mixamo-style skeleton of Xbot.glb so every existing clip, stroke pose and kit part keeps working. Geometry is in rest-pose world metres (same space as the original Beta_Surface vertices). */
export function build(T,src){
 src.updateWorldMatrix(true,true);
 const bones=src.skeleton.bones,id={};bones.forEach((b,i)=>id[b.name.replace('mixamorig','')]=i);
 const pw=n=>{const v=new T.Vector3();bones[id[n]].getWorldPosition(v);return v};
 const pos=[],sI=[],sW=[],ix=[],V=T.Vector3;
 const ss=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
 const push=(p,w)=>{pos.push(p.x,p.y,p.z);const l=w.filter(q=>q[1]>1e-4&&id[q[0]]!=null).sort((a,b)=>b[1]-a[1]).slice(0,4);let t=0;l.forEach(q=>t+=q[1]);for(let j=0;j<4;j++){const q=l[j];sI.push(q?id[q[0]]:0);sW.push(q?q[1]/t:0)}};
 /* stations: [{p,rU,rV,w}] along direction d; sides around */
 function tube(st,d,sides,u0){const Z=new V(0,0,1),X=new V(1,0,0);d=d.clone().normalize();let u=u0?u0.clone():new V().crossVectors(d,Math.abs(d.z)>.9?X:Z);u.normalize();const v=new V().crossVectors(d,u).normalize();
  const b=pos.length/3;
  for(const s of st)for(let k=0;k<sides;k++){const a=k/sides*Math.PI*2,c=Math.cos(a)*s.rU,n=Math.sin(a)*s.rV;push(new V(s.p.x+u.x*c+v.x*n,s.p.y+u.y*c+v.y*n,s.p.z+u.z*c+v.z*n),s.w)}
  for(let i=0;i<st.length-1;i++)for(let k=0;k<sides;k++){const a=b+i*sides+k,a1=b+i*sides+(k+1)%sides,c=a+sides,c1=a1+sides;ix.push(a,a1,c,a1,c1,c)}
  const cap=(s,i0,flip)=>{const ci=pos.length/3;push(s.p,s.w);for(let k=0;k<sides;k++){const a=b+i0*sides+k,a1=b+i0*sides+(k+1)%sides;if(flip)ix.push(ci,a1,a);else ix.push(ci,a,a1)}};
  cap(st[0],0,false);cap(st[st.length-1],st.length-1,true)}
 const lerp=(a,b,t)=>a+(b-a)*t;
 const prof=(P,t)=>{for(let i=0;i<P.length-1;i++)if(t<=P[i+1][0]){const q=ss(P[i][0],P[i+1][0],t);return[lerp(P[i][1],P[i+1][1],q),lerp(P[i][2],P[i+1][2],q)]}const l=P[P.length-1];return[l[1],l[2]]};
 const wl=(b,p,c)=>t=>{const wp=p?.5*(1-ss(0,.3,t)):0,wc=c?.5*ss(.7,1,t):0;const o=[[b,1-wp-wc]];if(p)o.push([p,wp]);if(c)o.push([c,wc]);return o};
 function limb(A,B,P,wf,n,sides,u0){const st=[];for(let i=0;i<=n;i++){const t=i/n,r=prof(P,t);st.push({p:A.clone().lerp(B,t),rU:r[0],rV:r[1],w:wf(t)})}tube(st,B.clone().sub(A),sides||14,u0)}
 function ball(c,rx,ry,rz,w,rings,sides,fn){rings=rings||10;const st=[],Y=new V(0,1,0);for(let i=0;i<=rings;i++){const th=Math.PI-i/rings*Math.PI,s=Math.max(.02,Math.sin(th)),y=Math.cos(th);const f=fn?fn(y,s):[1,1,0];st.push({p:new V(c.x,c.y+y*ry,c.z+(f[2]||0)),rU:rx*s*f[0],rV:rz*s*f[1],w:typeof w==='function'?w(i/rings):w})}tube(st,Y,sides||16,new V(1,0,0))}
 for(const side of['Left','Right']){const sg=side==='Left'?1:-1,L=n=>side+n,Pw=n=>pw(L(n));
  /* arms */
  const sh=Pw('Arm'),el=Pw('ForeArm'),wr=Pw('Hand');
  ball(sh,.066,.064,.066,[[L('Arm'),.62],['Spine2',.38]],8,14);
  limb(sh,el,[[0,.057,.056],[.4,.06,.06],[1,.044,.044]],wl(L('Arm'),L('Shoulder')&&'Spine2',L('ForeArm')),8);
  ball(el,.046,.046,.046,[[L('ForeArm'),.5],[L('Arm'),.5]],7,12);
  limb(el,wr,[[0,.046,.046],[.3,.049,.047],[1,.031,.027]],wl(L('ForeArm'),L('Arm'),L('Hand')),8);
  /* hand: palm and fingers */
  const m1=Pw('HandMiddle1'),ha=wr.clone();
  limb(ha.clone().lerp(m1,-.15),m1.clone().lerp(ha,-.0),[[0,.022,.04],[.5,.02,.05],[1,.017,.046]],()=>[[L('Hand'),1]],4,12);
  for(const f of['Index','Middle','Ring','Pinky']){const q=[1,2,3,4].map(k=>Pw('Hand'+f+k)),st=q.map((p,k)=>({p,rU:.0105-.0012*k,rV:.0105-.0012*k,w:[[L('Hand'+f+Math.min(k+1,3)),1]]}));st[0].p=st[0].p.clone();tube(st,q[3].clone().sub(q[0]),8,new V(0,1,0))}
  {const q=[1,2,3,4].map(k=>Pw('HandThumb'+k)),st=q.map((p,k)=>({p,rU:.0125-.0014*k,rV:.0125-.0014*k,w:[[L('HandThumb'+Math.min(k+1,3)),1]]}));tube(st,q[3].clone().sub(q[0]),8,new V(0,1,0))}
  /* legs */
  const hp=Pw('UpLeg'),kn=Pw('Leg'),an=Pw('Foot'),tb=Pw('ToeBase'),te=Pw('Toe_End');
  limb(hp,kn,[[0,.098,.1],[.3,.1,.1],[.7,.078,.08],[1,.058,.06]],wl(L('UpLeg'),'Hips',L('Leg')),9,16);
  ball(kn,.059,.058,.06,[[L('Leg'),.5],[L('UpLeg'),.5]],7,14);
  limb(kn,an,[[0,.058,.06],[.28,.061,.07],[.65,.046,.05],[1,.036,.038]],wl(L('Leg'),L('UpLeg'),L('Foot')),9,14);
  /* boot: heel to toe, along +z */
  {const x=an.x,fw=t=>t<.55?[[L('Foot'),1]]:[[L('Foot'),1-ss(.55,.8,t)],[L('ToeBase'),ss(.55,.8,t)]];
   const T0=[[-.075,.032,.034,.05],[-.055,.046,.05,.048],[-.01,.05,.056,.046],[.04,.05,.05,.043],[.1,.049,.04,.037],[.15,.04,.03,.03],[.185,.022,.016,.026]],st=T0.map((r,i)=>({p:new V(x,r[3]+(r[2]-r[1]>0?0:0),r[0]+.0),rU:r[1],rV:r[2],w:fw(i/(T0.length-1))}));
   tube(st,new V(0,0,1),14,new V(1,0,0))}
 }
 /* torso: pelvis to shoulders, wider at chest, tapered waist */
 {const TS=[[.9,.115,.085,.02,[['Hips',1]]],[.97,.16,.11,.02,[['Hips',1]]],[1.04,.172,.115,.022,[['Hips',1]]],[1.1,.158,.108,.022,[['Hips',.6],['Spine',.4]]],[1.142,.15,.103,.022,[['Hips',.5],['Spine',.5]]],[1.2,.152,.105,.02,[['Spine',.7],['Spine1',.3]]],[1.243,.165,.112,.018,[['Spine',.5],['Spine1',.5]]],[1.29,.18,.12,.012,[['Spine1',1]]],[1.334,.19,.124,.01,[['Spine1',.5],['Spine2',.5]]],[1.4,.2,.122,.004,[['Spine2',1]]],[1.45,.185,.108,-.01,[['Spine2',1]]],[1.49,.1,.085,-.022,[['Spine2',.6],['Neck',.4]]],[1.52,.058,.06,-.027,[['Neck',1]]]];
  tube(TS.map(r=>({p:new V(0,r[0],r[3]),rU:r[1],rV:r[2],w:r[4]})),new V(0,1,0),20,new V(1,0,0))}
 /* neck and head */
 {const nk=[[1.5,.056,.056,-.025,[['Neck',1]]],[1.56,.052,.054,-.018,[['Neck',.6],['Head',.4]]],[1.62,.05,.055,-.005,[['Head',1]]],[1.66,.05,.055,.0,[['Head',1]]]];
  tube(nk.map(r=>({p:new V(0,r[0],r[3]),rU:r[1],rV:r[2],w:r[4]})),new V(0,1,0),14,new V(1,0,0))}
 const hd=pw('Head');
 ball(new V(0,hd.y+.095,hd.z+.0),.088,.098,.1,[['Head',1]],14,20,(y,s)=>{const jaw=ss(-1,-.2,y);return[.78+.22*jaw+(y>0?.04*y:0),.88+.12*jaw,y<-.2?.02*(1+y):y<.5?.012:0]});
 ball(new V(0,hd.y+.03,hd.z+.095),.017,.022,.022,[['Head',1]],6,10);
 for(const sg of[1,-1])ball(new V(sg*.092,hd.y+.07,hd.z-.005),.011,.032,.02,[['Head',1]],6,10);
 ball(new V(0,hd.y-.01,hd.z+.06),.034,.028,.03,[['Head',1]],6,10);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(sI,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sW,4));g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(pos.length/3*2),2));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();
 return g}
export function tiny(T){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0,0,0,0],3));g.setAttribute('normal',new T.Float32BufferAttribute([0,1,0,0,1,0,0,1,0],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,0,0,0,0],2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,0,0,0,0],4));g.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));return g}
