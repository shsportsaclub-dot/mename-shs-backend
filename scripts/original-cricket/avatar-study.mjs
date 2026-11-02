import {avatarSurface} from './avatars.mjs';
// Original analytic surfaces in metres. Generic identity; no scan or downloaded model.
const studyG=(x,y,cx,cy,wx,wy)=>Math.exp(-(((x-cx)/wx)**2+((y-cy)/wy)**2));
const studyProfile=[[-.143,.010,.030],[-.124,.048,.075],[-.103,.072,.085],[-.070,.084,.087],[-.027,.092,.088],[.019,.095,.087],[.055,.092,.087],[.095,.082,.080],[.126,.055,.056],[.143,.002,.002]];
function studySection(y){
 if(y>.126){const cap=Math.sqrt(Math.max(0,(.143-y)/.017));return [Math.max(.0001,.055*cap),Math.max(.0001,.056*cap)];}
 let k=0;while(k<studyProfile.length-2&&y>studyProfile[k+1][0])k++;
 const a=studyProfile[k],b=studyProfile[k+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
 return [1,2].map(j=>{const prev=studyProfile[Math.max(0,k-1)],next=studyProfile[Math.min(studyProfile.length-1,k+2)],m0=(b[j]-prev[j])/(b[0]-prev[0]),m1=(next[j]-a[j])/(next[0]-a[0]),d=b[0]-a[0];return Math.max(.001,(2*t*t*t-3*t*t+1)*a[j]+(t*t*t-2*t*t+t)*d*m0+(-2*t*t*t+3*t*t)*b[j]+(t*t*t-t*t)*d*m1);});
}
function studyFaceRelief(x,y){
 const nose=.024*studyG(x,y,0,-.010,.012,.018)+.014*studyG(x,y,0,.023,.010,.035)+.005*studyG(x,y,0,-.025,.023,.008)+.005*(studyG(x,y,-.013,-.023,.007,.007)+studyG(x,y,.013,-.023,.007,.007));
 const orbit=-.010*(studyG(x,y,-.034,.027,.022,.013)+studyG(x,y,.034,.027,.022,.013))+.004*(studyG(x,y,-.035,.047,.025,.009)+studyG(x,y,.035,.047,.025,.009));
 const cheeks=.006*(studyG(x,y,-.057,-.010,.025,.027)+studyG(x,y,.057,-.010,.025,.027))-.002*(studyG(x,y,-.027,-.046,.008,.023)+studyG(x,y,.027,-.046,.008,.023));
 const mouth=.002*studyG(x,y,0,-.061,.029,.012)-.0018*studyG(x,y,0,-.046,.005,.010)+.005*studyG(x,y,0,-.106,.031,.018);
 return nose+orbit+cheeks+mouth;
}
export function studyFacePoint(x,y){const [w,d]=studySection(y),front=Math.sqrt(Math.max(0,1-(x/w)**2));return [x,y,d*front+studyFaceRelief(x,y)*front**3];}
function studyEyeOpening(side,q,upper){
 const x=side*.034+q*.0145,y=.027+(upper?.0050:-.0042)*Math.max(0,1-q*q)**.72+side*q*.0006,p=studyFacePoint(x,y);p[2]+=.0012;return p;
}
export function originalStudyAvatarMeshes(){
 const studyHead=avatarSurface(88,128,(u,v)=>{const lat=.009+u*(Math.PI-.018),y=Math.cos(lat)*.143,a=v*Math.PI*2,[w,d]=studySection(y),x=Math.sin(a)*w,f=Math.max(0,Math.cos(a)),z=Math.cos(a)*(Math.cos(a)<0?d*1.12:d)+studyFaceRelief(x,y)*f**3;return [x,y,z];},true);
 const studyHair=avatarSurface(56,128,(u,v)=>{const a=v*Math.PI*2,front=Math.max(0,Math.cos(a)),lat=.009+u*(1.67-front*.58-.14*front*Math.sin(a)**2),y=Math.cos(lat)*.143,[w,d]=studySection(y),x=Math.sin(a)*w,z=Math.cos(a)*(Math.cos(a)<0?d*1.12:d)+studyFaceRelief(x,y)*front**3,ripple=1.047+.005*Math.sin(a*71+lat*23)+.003*Math.sin(a*43-lat*61),quiff=.0025*front*Math.exp(-(((lat-.72)/.35)**2));return [x*ripple,y+.004+quiff,z*ripple];},true);
 const collarSide=side=>avatarSurface(10,10,(u,v)=>{const top=[side*(.037+v*.043),1.515-v*.009,.055+v*.016],bottom=[side*(.026+v*.034),1.462+v*.012,.123];return top.map((x,i)=>x+(bottom[i]-x)*u);},side>0,false);
 const left=collarSide(-1),right=collarSide(1),studyCollar={p:[...left.p,...right.p],n:[...left.n,...right.n],i:[...left.i,...right.i.map(i=>i+left.p.length/3)]};
 const result={studyHead,studyHair,studyCollar};
 for(const [side,name]of [[-1,'Left'],[1,'Right']]){
  result['studyEye'+name]=avatarSurface(12,48,(r,v)=>{const a=v*Math.PI*2,q=Math.cos(a),p=studyEyeOpening(side,q,Math.sin(a)>=0);p[0]=side*.034+(p[0]-side*.034)*r;p[1]=.027+(p[1]-.027)*r;p[2]=studyFacePoint(p[0],p[1])[2]+.0012+.0026*(1-r*r);return p;},true);
  for(const [upper,label]of [[true,'Upper'],[false,'Lower']])result['study'+label+'Lid'+name]=avatarSurface(8,64,(u,v)=>{const q=v*2-1,inner=studyEyeOpening(side,q,upper),x=inner[0]+q*.0025*u,y=inner[1]+(upper?1:-1)*(.0033*(1-q*q)+.0004)*u,outer=studyFacePoint(x,y);return [x,y,inner[2]*(1-u)+outer[2]*u+.0012*Math.sin(u*Math.PI)*(1-q*q)];},!upper,false);
 }
 for(const [upper,name]of [[true,'studyUpperLip'],[false,'studyLowerLip']])result[name]=avatarSurface(10,64,(u,v)=>{const q=v*2-1,x=q*.027,seam=-.061+.0007*q*q,cupid=.0016*Math.exp(-(((Math.abs(q)-.32)/.23)**2)),height=(upper?.0033+cupid:.0050)*(1-q*q),y=seam+(upper?1:-1)*height*u,p=studyFacePoint(x,y);p[2]+=(.0005+.0016*Math.sin(u*Math.PI))*(1-q*q);return p;},!upper,false);
 return result;
}
export function studyFacialParts({helmet=false}={}){
 const parts=[],skin=[.49,.30,.19],dark=[.025,.017,.013],p=(mesh,at,size,color,kind=0)=>parts.push({mesh,p:at,s:size,c:color,kind}),tube=(a,b,r,c)=>parts.push({a,b,r,c});
 p('studyHead',[0,1.66,0],[1,1,1],skin,11);if(!helmet)p('studyHair',[0,1.66,0],[1,1,1],dark,12);
 for(const name of ['studyUpperLip','studyLowerLip'])p(name,[0,1.66,0],[1,1,1],[.40,.215,.15],14);
 for(const [side,name]of [[-1,'Left'],[1,'Right']]){
  p('studyEye'+name,[0,1.66,0],[1,1,1],[.71,.69,.62],13);
  for(const label of ['Upper','Lower'])p('study'+label+'Lid'+name,[0,1.66,0],[1,1,1],skin,11);
  p('sphere',[side*.098,1.647,-.008],[.012,.027,.013],skin,1);p('sphere',[side*.104,1.647,.002],[.004,.017,.007],[.36,.19,.12],1);
  // Small broken strands follow brow direction, avoiding a repeated diagonal comb.
  for(let j=0;j<43;j++){const u=j/42,bx=side*(.018+u*.035),by=.047+Math.sin(u*Math.PI)*.0027-u*.0015+(j%3-1)*.00042,z=studyFacePoint(bx,by)[2],length=.0022+Math.sin(j*2.3)*.00045;tube([bx,by+1.66,z+.0007],[bx+side*.0014,by+1.66+length,z+.0009],.00028,dark);}
  const nostril=studyFacePoint(side*.010,-.0275);p('sphere',[nostril[0],1.66+nostril[1]-.0005,nostril[2]+.0003],[.0028,.0011,.0007],[.12,.055,.033]);
 }
 let prev=null;for(let i=0;i<=32;i++){const q=i/16-1,x=q*.027,y=-.061+.0007*q*q,at=studyFacePoint(x,y);at[1]+=1.66;at[2]+=.0009*(1-q*q);if(prev)tube(prev,at,.00020,[.24,.115,.075]);prev=at;}
 return parts;
}
export function studySleeveMesh(a,b){
 const axis=b.map((x,i)=>x-a[i]),length=Math.hypot(...axis),up=axis.map(x=>x/length),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],v=cross(up,[0,0,1]),vl=Math.hypot(...v),x=v.map(n=>n/vl),z=cross(x,up);
 return avatarSurface(20,40,(u,v)=>{const angle=v*Math.PI*2,r=(.020+.040*Math.sin(Math.min(1,u/.24)*Math.PI/2))+.009*Math.sin(Math.PI*u)-.001*u,fold=1+.003*Math.sin(u*31+angle*5);return a.map((n,i)=>n+axis[i]*u+r*fold*(Math.cos(angle)*x[i]+Math.sin(angle)*z[i]));},true);
}
export function studyAvatarCamera(view='portrait',aspect=1){
 aspect=Number.isFinite(aspect)&&aspect>0?Math.max(.2,aspect):1;
 const portrait=view==='portrait',fov=portrait?.51:.55,halfWidth=portrait?.145:.85,minimum=portrait?1.18:3.95,distance=Math.max(minimum,halfWidth/(Math.tan(fov/2)*aspect)),target=portrait?[0,1.59,0]:[.20,.96,0];
 return {eye:portrait?[.02,1.67,distance]:[.20,1.10,distance],target,fov,name:portrait?'AVATAR PORTRAIT':'AVATAR FULL BODY'};
}
