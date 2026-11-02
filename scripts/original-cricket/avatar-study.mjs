import {avatarSurface} from './avatars.mjs';
// Authored analytic anatomy in metres: a generic original adult, not a face scan.
const studyG=(x,y,cx,cy,wx,wy)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
const studyProfile=[[-.143,.010,.030],[-.124,.044,.073],[-.103,.065,.083],[-.070,.077,.085],[-.027,.092,.088],[.019,.096,.087],[.055,.093,.087],[.095,.083,.080],[.126,.055,.056],[.143,.002,.002]];
function studySection(y){let k=0;while(k<studyProfile.length-2&&y>studyProfile[k+1][0])k++;const a=studyProfile[k],b=studyProfile[k+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return [1,2].map(j=>{const prev=studyProfile[Math.max(0,k-1)],next=studyProfile[Math.min(studyProfile.length-1,k+2)],m0=(b[j]-prev[j])/(b[0]-prev[0]),m1=(next[j]-a[j])/(next[0]-a[0]),d=b[0]-a[0];return Math.max(.001,(2*t*t*t-3*t*t+1)*a[j]+(t*t*t-2*t*t+t)*d*m0+(-2*t*t*t+3*t*t)*b[j]+(t*t*t-t*t)*d*m1);});}
function studyFaceRelief(x,y){return .029*studyG(x,y,0,-.010,.014,.020)+.011*studyG(x,y,0,.025,.011,.040)+.011*studyG(x,y,0,-.026,.025,.009)-.012*(studyG(x,y,-.034,.026,.023,.014)+studyG(x,y,.034,.026,.023,.014))+.006*(studyG(x,y,-.034,.050,.026,.010)+studyG(x,y,.034,.050,.026,.010))+.007*(studyG(x,y,-.059,-.012,.023,.029)+studyG(x,y,.059,-.012,.023,.029))-.003*(studyG(x,y,-.024,-.046,.008,.022)+studyG(x,y,.024,-.046,.008,.022))+.007*studyG(x,y,0,-.061,.029,.011)+.006*studyG(x,y,0,-.109,.031,.018);}
export function studyFacePoint(x,y){const [w,d]=studySection(y),front=Math.sqrt(Math.max(0,1-(x/w)**2));return [x,y,d*front+studyFaceRelief(x,y)*front**3];}
export function originalStudyAvatarMeshes(){
 const studyHead=avatarSurface(88,128,(u,v)=>{const lat=.009+u*(Math.PI-.018),y=Math.cos(lat)*.143,a=v*Math.PI*2,[w,d]=studySection(y),x=Math.sin(a)*w,f=Math.max(0,Math.cos(a)),z=Math.cos(a)*(Math.cos(a)<0?Math.max(d,.085)*1.12:d)+studyFaceRelief(x,y)*f**3;return [x,y,z];},true);
 const studyHair=avatarSurface(40,96,(u,v)=>{const a=v*Math.PI*2,front=Math.max(0,Math.cos(a)),lat=.009+u*(1.68-front*.60),y=Math.cos(lat)*.143,[w,d]=studySection(y),x=Math.sin(a)*w,z=Math.cos(a)*(Math.cos(a)<0?Math.max(d,.085)*1.12:d)+studyFaceRelief(x,y)*front**3,ripple=1.045+.004*Math.sin(a*37+lat*19);return [x*ripple,y+.004,z*ripple];},true);
 const studyEye=avatarSurface(12,48,(u,v)=>{const angle=v*Math.PI*2,r=u,x=Math.cos(angle)*.0145*r,y=Math.sin(angle)*.0055*r;return [x,y,.0025*(1-r*r)];},true);
 const collarSide=side=>avatarSurface(10,10,(u,v)=>{const top=[side*(.037+v*.043),1.515-v*.009,.055+v*.016],bottom=[side*(.024+v*.038),1.435+v*.012,.126];return top.map((x,i)=>x+(bottom[i]-x)*u);},side>0);
 const left=collarSide(-1),right=collarSide(1),studyCollar={p:[...left.p,...right.p],n:[...left.n,...right.n],i:[...left.i,...right.i.map(i=>i+left.p.length/3)]};
 return {studyHead,studyHair,studyEye,studyCollar};
}
export function studyFacialParts({helmet=false}={}){
 const parts=[],skin=[.48,.285,.17],dark=[.035,.023,.016],p=(mesh,at,size,color,kind=0)=>parts.push({mesh,p:at,s:size,c:color,kind}),tube=(a,b,r,c)=>parts.push({a,b,r,c});
 p('studyHead',[0,1.66,0],[1,1,1],skin,11);
 if(!helmet)p('studyHair',[0,1.66,-.002],[1,1,1],dark,12);
 for(const side of [-1,1]){
  p('sphere',[side*.098,1.647,-.008],[.014,.030,.014],skin,1);p('sphere',[side*.105,1.649,.002],[.006,.020,.009],[.34,.17,.105],1);p('sphere',[side*.104,1.638,.009],[.005,.011,.005],skin,1);
  const x=side*.034,eye=studyFacePoint(x,.026);p('studyEye',[x,1.686,eye[2]+.002],[1,1,1],[.64,.65,.60]);p('sphere',[x,1.686,eye[2]+.005],[.0043,.0043,.0014],[.105,.070,.033]);p('sphere',[x,1.686,eye[2]+.0063],[.002,.0025,.0006],[.008,.009,.009]);p('sphere',[x-.0012,1.6875,eye[2]+.0069],[.0008,.0008,.0003],[.98,.98,.96]);
  for(const upper of [true,false]){let prev=null;for(let j=0;j<=16;j++){const dx=-.0145+j*.029/16,dy=(upper?1:-1)*Math.sqrt(Math.max(0,1-(dx/.0145)**2))*.0055,pos=studyFacePoint(x+dx,.026+dy);pos[1]+=1.66;pos[2]+=.0018;if(prev)tube(prev,pos,upper?.0017:.0012,upper?[.28,.15,.095]:skin);prev=pos;}}
  for(let j=0;j<20;j++){const u=j/19,bx=side*(.018+u*.033),by=.050+Math.sin(u*Math.PI)*.003-u*.002,z=studyFacePoint(bx,by)[2];tube([bx,by+1.66,z+.0015],[bx+side*.0025,by+1.664,z+.0018],.00065,dark);}
  const nostril=studyFacePoint(side*.010,-.026);p('sphere',[nostril[0],1.66+nostril[1],nostril[2]+.0004],[.0038,.0018,.0012],[.09,.038,.024]);
 }
 return parts;
}

export function studySleeveMesh(a,b){const axis=b.map((x,i)=>x-a[i]),length=Math.hypot(...axis),up=axis.map(x=>x/length),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],v=cross(up,[0,0,1]),vl=Math.hypot(...v),x=v.map(n=>n/vl),z=cross(x,up);return avatarSurface(14,32,(u,v)=>{const angle=v*Math.PI*2,r=.078-(.078-.061)*u,fold=1+.014*Math.sin(u*33+angle*7);return a.map((n,i)=>n+axis[i]*u+r*fold*(Math.cos(angle)*x[i]+Math.sin(angle)*z[i]));},true);}

export function studyAvatarCamera(view='portrait',aspect=1){
 aspect=Number.isFinite(aspect)&&aspect>0?Math.max(.2,aspect):1;
 const portrait=view==='portrait',fov=portrait?.51:.55,halfWidth=portrait?.145:.85,minimum=portrait?1.18:3.95,distance=Math.max(minimum,halfWidth/(Math.tan(fov/2)*aspect)),target=portrait?[0,1.59,0]:[.20,.96,0];
 return {eye:portrait?[.02,1.67,distance]:[.20,1.10,distance],target,fov,name:portrait?'AVATAR PORTRAIT':'AVATAR FULL BODY'};
}
