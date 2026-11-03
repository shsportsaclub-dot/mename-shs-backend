/* Scoring Heroes - 3D Batting Animation Master
   Pure pose maths (no three.js): shot table + clip generator for RIGHT-hand and LEFT-hand batters.
   Left-hand batters are NOT a flipped copy of the clip: the bat moves to the left hand (bottom hand),
   the front foot becomes the right leg, hips/shoulders/direction are re-derived for that hand.
   Pose objects use the "P" parameter space of the lab rig (Mixamo skeleton, angles in degrees):
   lean, twist, head, aL/aR=[fwd,side,elbow], lL/lR=[hip,knee], y, r=[x,y,z], ry, rx, rz.
   Right-hander reference: faces -z, off side = +x, bottom hand = right arm (aR), front leg = left leg (lL). */
const S=(a,b,t)=>{t=Math.min(1,Math.max(0,(t-a)/(b-a)));return t*t*(3-2*t)};
const L=(a,b,k)=>a+(b-a)*k;
const lerpArr=(a,b,k)=>a.map((v,i)=>L(v,b[i],k));

export const CAL={"FF_DRV":107,"FF_PUNCH":52,"FF_FLICK":-32,"FF_PULL":-47,"BF_DRV":92,"BF_PUNCH":20,"BF_CUT":160,"BF_PULL":0,"DRV_ST":115,"DRV_CV":160,"DRV_XC":160,"DRV_SQ":160,"DRV_OFF":112,"DRV_ON":25,"DRV_IO":160,"GL_LEG":-34,"GL_FINE":-160,"GL_FF":-61,"GL_BF":-37,"FL_WRIST":0,"FL_ON":-41,"FL_PICK":25,"FL_AIR":-51,"CUT_SQ":160,"CUT_LATE":-38,"CUT_UP":160,"CUT_SLAP":147,"CUT_REV":-69,"PUL_FF":-100,"PUL_BF":-34,"PUL_SHORT":25,"PUL_AIR":25,"PUL_ROLL":25,"HK":0,"HK_CTRL":0,"HK_AIR":0,"HK_FINE":-160,"SW":0,"SW_PAD":-160,"SW_SLOG":-82,"SW_REV":-67,"SW_SWITCH":-72,"SW_FINE":-160,"HEL":132,"HEL_FF":155,"HEL_BF":160,"HEL_PICK":83,"HEL_ONE":133,"LOF_ST":110,"LOF_CV":160,"LOF_ON":25,"LOF_IO":160,"SLOG":-34,"SLOG_CB":-82,"SLOG_LEG":-50,"UN_SWITCH":-160,"UN_REV":25,"UN_LAP":-160,"UN_NOLOOK":25,"UN_TENNIS":50,"UN_ONE":58,"TP_OPEN":-24}; // auto-calibrated twist bias per shot (filled by calibration run)
/* ---------- shot families (right-hander reference) ----------
   Each variant: [id, name, family, ft(F/B/N), dir(+off,-leg, degrees), params]
   params: pw(power 0-1) lf(loft 0-1) hi(bat height 0 low..1 high) cr(cross-bat 0..1) fin(two|one|wrap|heli|low|none) lo(crouch) st(step-out 0..1)
*/
const T=(id,name,fam,ft,dir,p)=>({id,name,fam,ft,dir,p:Object.assign({pw:.6,lf:0,hi:.4,cr:0,fin:'two',lo:0,st:0,tb:(typeof CAL!=='undefined'&&CAL[id])||0},p||{})});
export const SHOTS=[
 // Front foot
 T('FF_DEF','Front Foot Defence','Front Foot','F',0,{pw:.15,fin:'none'}),
 T('FF_DRV','Front Foot Drive','Front Foot','F',15,{pw:.75}),
 T('FF_PUNCH','Front Foot Punch','Front Foot','F',35,{pw:.35,fin:'one'}),
 T('FF_FLICK','Front Foot Flick','Front Foot','F',-60,{pw:.55,cr:.5}),
 T('FF_PULL','Front Foot Pull','Front Foot','F',-75,{pw:.8,cr:.9,hi:.6}),
 // Back foot
 T('BF_DEF','Back Foot Defence','Back Foot','B',0,{pw:.15,fin:'none'}),
 T('BF_DRV','Back Foot Drive','Back Foot','B',25,{pw:.7,hi:.6}),
 T('BF_PUNCH','Back Foot Punch','Back Foot','B',40,{pw:.5,hi:.55,fin:'one'}),
 T('BF_CUT','Back Foot Cut','Back Foot','B',110,{pw:.65,cr:.7,hi:.5}),
 T('BF_PULL','Back Foot Pull','Back Foot','B',-80,{pw:.8,cr:.9,hi:.7}),
 // Drive
 T('DRV_ST','Straight Drive','Drive','F',0,{pw:.8}),
 T('DRV_CV','Cover Drive','Drive','F',40,{pw:.8,fin:'wrap'}),
 T('DRV_XC','Extra Cover Drive','Drive','F',60,{pw:.8,fin:'wrap'}),
 T('DRV_SQ','Square Drive','Drive','B',100,{pw:.75,cr:.5}),
 T('DRV_OFF','Off Drive','Drive','F',20,{pw:.72}),
 T('DRV_ON','On Drive','Drive','F',-25,{pw:.8,fin:'wrap'}),
 T('DRV_IO','Inside-out Drive','Drive','F',55,{pw:.85,lf:.4,st:.6,fin:'wrap'}),
 // Glance
 T('GL_LEG','Leg Glance','Glance','F',-70,{pw:.35,cr:.4,fin:'one'}),
 T('GL_FINE','Fine Leg Glance','Glance','F',-110,{pw:.3,cr:.3,fin:'one'}),
 T('GL_FF','Front Foot Glance','Glance','F',-80,{pw:.35,cr:.4,fin:'one'}),
 T('GL_BF','Back Foot Glance','Glance','B',-85,{pw:.35,cr:.4,fin:'one'}),
 T('GL_PAD','Glance off the Pads','Glance','F',-75,{pw:.3,cr:.3,fin:'none'}),
 // Flick
 T('FL_WRIST','Wrist Flick','Flick','F',-55,{pw:.5,cr:.6,fin:'one'}),
 T('FL_ON','On-side Flick','Flick','F',-65,{pw:.6,cr:.6}),
 T('FL_PICK','Pick-up Flick','Flick','B',-70,{pw:.7,cr:.7,lf:.5,hi:.55}),
 T('FL_AIR','Aerial Flick','Flick','F',-60,{pw:.75,cr:.6,lf:.7}),
 // Cut
 T('CUT_SQ','Square Cut','Cut','B',120,{pw:.7,cr:.8,hi:.45}),
 T('CUT_LATE','Late Cut','Cut','B',120,{pw:.45,cr:.5,hi:.35,fin:'one'}),
 T('CUT_UP','Upper Cut','Cut','B',130,{pw:.8,lf:.8,hi:.85,cr:.3,fin:'one'}),
 T('CUT_SLAP','Slap Cut','Cut','B',115,{pw:.9,cr:.8,hi:.6}),
 T('CUT_REV','Reverse Cut','Cut','B',-100,{pw:.6,cr:.7,hi:.45,fin:'one'}),
 // Pull
 T('PUL_FF','Front Foot Pull (hit)','Pull','F',-85,{pw:.85,cr:.95,hi:.65}),
 T('PUL_BF','Back Foot Pull (hit)','Pull','B',-90,{pw:.85,cr:.95,hi:.7}),
 T('PUL_SHORT','Short-arm Pull','Pull','B',-80,{pw:.7,cr:.8,hi:.7,fin:'one'}),
 T('PUL_AIR','Aerial Pull','Pull','B',-85,{pw:.9,cr:.95,hi:.75,lf:.8}),
 T('PUL_ROLL','Roll-wrist Pull','Pull','B',-90,{pw:.7,cr:.9,hi:.7,fin:'wrap'}),
 // Hook
 T('HK','Hook','Hook','B',-105,{pw:.8,cr:.95,hi:.85}),
 T('HK_CTRL','Controlled Hook','Hook','B',-110,{pw:.55,cr:.9,hi:.95,fin:'one'}),
 T('HK_AIR','Aerial Hook','Hook','B',-100,{pw:.85,cr:.95,hi:.78,lf:.8}),
 T('HK_FINE','Fine Hook','Hook','B',-125,{pw:.6,cr:.8,hi:.95,fin:'one'}),
 // Sweep
 T('SW','Conventional Sweep','Sweep','F',-75,{kn:1,pw:.6,cr:.7,lo:1,hi:.05,fin:'low'}),
 T('SW_PAD','Paddle Sweep','Sweep','F',-120,{kn:0.85,pw:.3,cr:.3,lo:.8,hi:.05,fin:'low'}),
 T('SW_SLOG','Slog Sweep','Sweep','F',-80,{kn:0.9,pw:.95,cr:.9,lo:.8,hi:.2,lf:.8,fin:'wrap'}),
 T('SW_REV','Reverse Sweep','Sweep','F',110,{kn:1,pw:.5,cr:.6,lo:1,hi:.05,fin:'low'}),
 T('SW_SWITCH','Switch Sweep','Sweep','F',100,{kn:1,pw:.34,cr:.7,lo:1,hi:.05,fin:'low'}),
 T('SW_FINE','Fine Sweep','Sweep','F',-130,{kn:1,pw:.4,cr:.4,lo:1,hi:.05,fin:'low'}),
 // Helicopter
 T('HEL','Helicopter Shot','Helicopter','F',-10,{pw:1,lf:1,hi:.3,fin:'heli'}),
 T('HEL_FF','Front Foot Helicopter','Helicopter','F',-5,{pw:1,lf:1,hi:.3,fin:'heli'}),
 T('HEL_BF','Back Foot Helicopter','Helicopter','B',-15,{pw:1,lf:1,hi:.4,fin:'heli'}),
 T('HEL_PICK','Pick-up Helicopter','Helicopter','B',-35,{pw:1,lf:.9,hi:.4,cr:.3,fin:'heli'}),
 T('HEL_ONE','One-handed Helicopter Finish','Helicopter','F',-8,{pw:1,lf:1,hi:.3,fin:'heli1'}),
 // Scoop
 T('SC','Scoop','Scoop','F',-170,{kn:1,pw:.7,lf:.7,lo:1,hi:.1,fin:'low'}),
 T('SC_DIL','Dilscoop','Scoop','F',-165,{kn:1,pw:.7,lf:.7,lo:1,hi:.1,fin:'low'}),
 T('SC_PAD','Paddle Scoop','Scoop','F',-160,{kn:0.9,pw:.4,lf:.5,lo:1,hi:.1,fin:'low'}),
 T('SC_REV','Reverse Scoop','Scoop','F',160,{kn:1,pw:.6,lf:.6,lo:1,hi:.1,fin:'low'}),
 T('SC_FALL','Falling Scoop','Scoop','F',-170,{kn:1,pw:.7,lf:.7,lo:1,hi:.1,fin:'low',st:.5}),
 // Ramp
 T('RAMP','Ramp','Ramp','B',-175,{pw:.7,lf:.8,hi:.9,fin:'one'}),
 T('RAMP_REV','Reverse Ramp','Ramp','B',175,{pw:.7,lf:.8,hi:.9,fin:'one'}),
 T('RAMP_UP','Upper Ramp','Ramp','B',-170,{pw:.7,lf:.9,hi:1,fin:'one'}),
 T('RAMP_FINE','Fine Leg Ramp','Ramp','B',-150,{pw:.6,lf:.7,hi:.9,fin:'one'}),
 // Lofted
 T('LOF_ST','Lofted Straight Drive','Lofted','F',0,{pw:.95,lf:1,fin:'wrap'}),
 T('LOF_CV','Lofted Cover Drive','Lofted','F',40,{pw:.95,lf:1,fin:'wrap'}),
 T('LOF_ON','Lofted On Drive','Lofted','F',-25,{pw:.95,lf:1,fin:'wrap'}),
 T('LOF_IO','Inside-out Loft','Lofted','F',55,{pw:.95,lf:1,st:.6,fin:'wrap'}),
 // Slog
 T('SLOG','Slog','Slog','F',-70,{kn:0.9,pw:1,lf:.9,cr:1,hi:.5,fin:'wrap'}),
 T('SLOG_CB','Cross-batted Slog','Slog','F',-85,{kn:0.9,pw:1,lf:.9,cr:1,hi:.55,fin:'wrap'}),
 T('SLOG_LEG','Leg-side Slog','Slog','F',-80,{kn:0.9,pw:1,lf:.9,cr:1,hi:.5,fin:'wrap'}),
 // Unorthodox
 T('UN_SWITCH','Switch Hit','Unorthodox','F',-60,{pw:.9,lf:.7,cr:.6,fin:'switch'}),
 T('UN_REV','Reverse Hit','Unorthodox','F',100,{pw:.8,lf:.5,cr:.7,fin:'wrap'}),
 T('UN_LAP','Lap Shot','Unorthodox','F',-105,{kn:1,pw:.6,lf:.3,lo:1,hi:.05,fin:'low'}),
 T('UN_NOLOOK','No-look Shot','Unorthodox','F',-30,{pw:.65,lf:.5,fin:'one'}),
 T('UN_TENNIS','Tennis-style Shot','Unorthodox','B',-45,{pw:.65,cr:.9,hi:.7,fin:'one'}),
 T('UN_ONE','One-handed Shot','Unorthodox','F',20,{pw:.4,fin:'one'}),
 // Touch & placement
 T('TP_DAB','Dab','Touch','B',100,{pw:.2,hi:.1,fin:'none'}),
 T('TP_STEER','Steer','Touch','B',105,{pw:.3,hi:.3,fin:'none'}),
 T('TP_GUIDE','Guide','Touch','B',115,{pw:.25,hi:.3,fin:'none'}),
 T('TP_SOFT','Soft Hands','Touch','F',20,{pw:.12,fin:'none'}),
 T('TP_RUN','Drop-and-Run','Touch','F',30,{pw:.15,fin:'none',st:.3}),
 T('TP_OPEN','Open-face Shot','Touch','B',90,{pw:.35,hi:.35,fin:'one'}),
 // Defensive
 T('DF_FWD','Forward Defence','Defensive','F',0,{pw:.1,fin:'none'}),
 T('DF_BWD','Backward Defence','Defensive','B',0,{pw:.1,fin:'none'}),
 T('DF_DEAD','Dead Bat','Defensive','F',0,{pw:0,fin:'none'}),
 T('DF_SMOTHER','Smother Spin','Defensive','F',0,{pw:.1,st:.8,fin:'none'}),
 T('DF_LEAVE','Leave','Defensive','N',0,{pw:0,fin:'leave'}),
 T('DF_DUCK','Duck','Defensive','N',0,{pw:0,fin:'duck'}),
 T('DF_SWAY','Sway','Defensive','N',0,{pw:0,fin:'sway'})
];
export const SHOT_BY_ID=Object.fromEntries(SHOTS.map(s=>[s.id,s]));
export const FAMILIES=[...new Set(SHOTS.map(s=>s.fam))];

/* ---------- hand configuration ---------- */
export const HAND={
 R:{bottom:'RightHand',top:'LeftHand',frontLeg:'LeftUpLeg',backLeg:'RightUpLeg',offSide:+1,stanceX:-.5,note:'right-hand: right hand bottom, left foot forward, off side = +x'},
 L:{bottom:'LeftHand',top:'RightHand',frontLeg:'RightUpLeg',backLeg:'LeftUpLeg',offSide:-1,stanceX:+.5,note:'left-hand: left hand bottom, right foot forward, off side = -x'}
};

/* ---------- raw pose (right-hander) ---------- */
function rawPose(shot,t,T0){ // t in seconds; T0 timings
 const p=shot.p,F=shot.ft==='F',B=shot.ft==='B';
 const dir=shot.dir,off=Math.max(-1,Math.min(1,dir/90)),cr=p.cr,pw=p.pw,hi=p.hi,lf=p.lf,lo=p.lo;
 const dd=Math.max(-160,Math.min(160,dir+(p.tb||0))),TS=-1,BT=-TS*dd*.4*(.5+cr),tw=TS*dd*.06;
 const a=S(0,T0.back,t),c=S(T0.back,T0.hit,t),f=S(T0.hit,T0.fin,t),h=S(T0.fin,T0.hold,t),rec=S(T0.hold,T0.end,t);
 // key poses: stance -> backlift -> contact -> follow-through
 const stance={lean:26,twist:0,head:-6,hy:45,aTop:[10,0,60],aBot:[12,0,62],front:[18,24],back:[10,24],y:-12,r:[0,0,0],ry:0,rx:0};
 const bl={lean:L(10,4,pw),twist:BT,head:0,aTop:[L(-14,16,hi),0,L(110,140,pw)],aBot:[L(-10,20,hi),0,L(110,140,pw)],front:[10,12],back:[-4,12],y:-4,r:[0,0,0],ry:cr*10,rx:0};

 const reach=F?1:0;
 let ct={lean:F?L(20,34,pw)+lo*14:B?L(-4,6,pw):10+lo*10,twist:tw,head:F?18:B?8:0,
   aTop:[L(50,62,hi)+L(0,26,hi)+pw*8+cr*14,-off*34*(.3+cr)+hi*8,L(38,16,pw)],aBot:[L(52,66,hi)+L(0,26,hi)+pw*8+cr*16,off*34*(.3+cr)+hi*8,L(42,14,pw)],
   front:F?[L(26,46,pw)+p.st*20,L(30,44,pw)+lo*20]:B?[8,12]:[10,14],back:F?[-12,L(14,22,pw)]:B?[L(6,14,pw),L(8,14,pw)+lo*20]:[-2,10],
   y:-8-lo*18-(F?4:0),r:[off*.05,0,F?-.15-p.st*.45:B?.1:0],ry:-dir*.15,rx:0};
 const kn=p.kn||0;if(kn){ct.front=[L(ct.front[0],74,kn),L(ct.front[1],92,kn)];ct.back=[L(ct.back[0],-32,kn),L(ct.back[1],128,kn)];ct.y=L(ct.y,-50,kn);ct.lean=L(ct.lean,30,kn);ct.head=L(ct.head,-22,kn);ct.aTop=[L(ct.aTop[0],78,kn),ct.aTop[1],L(ct.aTop[2],34,kn)];ct.aBot=[L(ct.aBot[0],80,kn),ct.aBot[1],L(ct.aBot[2],34,kn)];bl.front=[L(bl.front[0],40,kn),L(bl.front[1],50,kn)];bl.back=[L(bl.back[0],-15,kn),L(bl.back[1],70,kn)];bl.y=L(bl.y,-30,kn)}
 if(p.fin==='switch'){ct.twist=-tw}
 // arm elevation for loft / low shots
 if(hi>.7){ct.aTop[1]+=18*cr;ct.aBot[1]+=18*cr}
 if(hi<.15){ct.aTop[0]=L(48,70,pw);ct.aBot[0]=L(50,74,pw)}
 let ft={...ct,lean:ct.lean+L(0,8,pw)+lf*-18,twist:TS*dd*.8*(.5+cr),
   aTop:[ct.aTop[0]+L(50,128,pw)+lf*30,ct.aTop[1]+10,60+lf*25],aBot:[ct.aBot[0]+L(50,128,pw)+lf*30,ct.aBot[1]+10,60+lf*25],head:ct.head-lf*12,ry:ct.ry*1.8};
 const fin=p.fin;
 if(fin==='one'||fin==='heli1'){ft.aTop=[10,10,25];ft.aBot=[ct.aBot[0]+50,ct.aBot[1]+8,50]}
 if(fin==='wrap'){ft.aTop=[165,20,115];ft.aBot=[160,20,125];ft.twist=TS*dd*.8*(.5+cr);ft.lean=ct.lean-20-lf*14;ft.head=0}
 if(fin==='heli'){ft.aTop=[170,35,100];ft.aBot=[175,35,110];ft.twist=TS*dd*.4+40;ft.lean=-22;ft.y=-4;ft.head=-8}
 if(fin==='heli1'){ft.aTop=[10,10,25];ft.aBot=[175,40,95];ft.twist=TS*dd*.4+40;ft.lean=-22}
 if(fin==='low'){ft.aTop=[ct.aTop[0]+10,ct.aTop[1]+15,40];ft.aBot=[ct.aBot[0]+10,ct.aBot[1]+15,40]}
 if(fin==='none'){ft=ct}
 // special non-hitting shots
 if(fin==='leave'){const l=S(0,.5,t)*(1-S(.9,1.4,t));return mk({lean:L(14,8,l),twist:L(0,-12,l),head:L(0,10,l),aTop:lerpArr(stance.aTop,[30,35,20],l),aBot:lerpArr(stance.aBot,[30,40,20],l),front:stance.front,back:stance.back,y:-4,r:[0,0,0]})}
 if(fin==='duck'){const l=S(0,.45,t)*(1-S(.9,1.5,t));return mk({lean:L(14,52,l),twist:L(0,-10,l),head:L(0,18,l),aTop:lerpArr(stance.aTop,[30,25,70],l),aBot:lerpArr(stance.aBot,[30,30,70],l),front:lerpArr(stance.front,[30,60],l),back:lerpArr(stance.back,[18,60],l),y:L(-4,-34,l),r:[0,0,0]})}
 if(fin==='sway'){const l=S(0,.45,t)*(1-S(.9,1.5,t));return mk({lean:L(14,-6,l),twist:L(0,10,l),head:L(0,-8,l),aTop:lerpArr(stance.aTop,[60,30,95],l),aBot:lerpArr(stance.aBot,[60,35,95],l),front:lerpArr(stance.front,[12,16],l),back:lerpArr(stance.back,[-4,16],l),y:-8*l-4,r:[0,0,0],rz:L(0,-14,l)})}
 const m=(k,A,Bk,C)=>{ // blend through stance->backlift->contact->follow
  const x1=lerpArr(A,Bk,a);const x2=lerpArr(x1,C,c);return x2};
 const lerpO=(A,Bo,k)=>{const o={};for(const n in A){o[n]=Array.isArray(A[n])?lerpArr(A[n],Bo[n],k):L(A[n],Bo[n],k)}return o};
 const lerpO3=(A,Bo,C,w)=>{const o={},l1=2*(w-.5)*(w-1),l2=-4*w*(w-1),l3=2*w*(w-.5);for(const n in A){o[n]=Array.isArray(A[n])?A[n].map((v,i)=>v*l1+Bo[n][i]*l2+C[n][i]*l3):A[n]*l1+Bo[n]*l2+C[n]*l3}return o};
 const sw=Math.min(1,Math.max(0,(t-T0.back)/(T0.fin-T0.back))),we=sw*sw*(3-2*sw);
 let cur;if(t<T0.back)cur=lerpO(stance,bl,a);else if(t<=T0.fin)cur=lerpO3(bl,ct,ft,we);else cur=ft;
 // recovery to stance
 cur=lerpO(cur,stance,rec);
 return mk(cur)}
const ct2=v=>Math.max(-95,Math.min(95,v));
const cl=a=>[Math.max(-60,Math.min(185,a[0])),a[1],Math.max(0,Math.min(150,a[2]))];
function mk(o){return{hy:o.hy||0,lean:o.lean,twist:ct2(o.twist),head:o.head,aL:cl(o.aTop),aR:cl(o.aBot),lL:o.front,lR:o.back,y:o.y,r:o.r||[0,0,0],ry:o.ry||0,rx:o.rx||0,rz:o.rz||0}}
/* mirror a right-hander pose into left-hander space (bat hand + foot + direction re-derived) */
export function mirrorPose(p){return{hy:-(p.hy||0),lean:p.lean,twist:-p.twist,head:p.head,aL:p.aR,aR:p.aL,lL:p.lR,lR:p.lL,y:p.y,r:[-p.r[0],p.r[1],p.r[2]],ry:-p.ry,rx:p.rx,rz:-p.rz}}
export const TIMING={back:.42,hit:.52,fin:.62,hold:1.1,end:1.6};
/* build a clip {dur,f(t)->pose} for shot id and hand ('R'|'L'). contactT = moment of bat-ball contact. */
export function buildClip(id,hand){const shot=SHOT_BY_ID[id];if(!shot)throw Error('unknown shot '+id);
 const T0=TIMING,left=hand==='L';
 return{id,hand,dur:T0.end,contactT:T0.hit,shot,f:t=>{const p=rawPose(shot,t,T0);return left?mirrorPose(p):p}}}
/* ---------- ball launch derived from the shot (used by physics test + live preview) ---------- */
export function launchFor(id,hand){const s=SHOT_BY_ID[id],sgn=HAND[hand].offSide;const dir=s.dir*Math.PI/180;
 // world dir: right-hander off side = +x; batter hits towards -z? the ball travels from the bowler end(-z) to batter; "straight" = back towards bowler (-z)
 const speed=4+s.p.pw*26,vx=Math.sin(dir)*sgn*speed,vz=-Math.cos(dir)*speed,vy=s.p.lf*10+(s.p.pw>.2?1.2:0);
 return{v:[vx,vy,vz],speed,azimuthDeg:Math.atan2(vx,-vz)*180/Math.PI}}
/* ---------- live event -> shot mapping (app shot names + foot + ball events) ---------- */
export function pickShot(ev){ // ev:{shot,foot,runs,out,ang(deg, -180..180, 0=straight, +off),loft,pitch:'full'|'good'|'short'|'yorker',pace:bool,spin:bool}
 const sh=(ev.shot||'Other'),ft=/back/i.test(ev.foot||'')?'B':/down/i.test(ev.foot||'')?'D':'F',a=ev.ang==null?0:ev.ang,r=ev.runs||0,loft=!!ev.loft||r===6;
 if(ev.leave)return'DF_LEAVE';if(ev.duck)return'DF_DUCK';
 if(r===6&&!/Sweep|Hook|Pull|Upper/.test(sh))return a<-70?'SLOG':a<-5?'LOF_ON':a>35?'LOF_CV':'LOF_ST';
 switch(sh){
  case'Defence':return ft==='B'?'DF_BWD':r===0&&ev.spin?'DF_SMOTHER':'DF_FWD';
  case'Drive':return a>50?'DRV_XC':a>25?'DRV_CV':a<-15?'DRV_ON':ft==='B'?'BF_DRV':Math.abs(a)<8?'DRV_ST':'DRV_OFF';
  case'Cut':return loft?'CUT_UP':a>110?'CUT_LATE':'CUT_SQ';
  case'Upper cut':return'CUT_UP';
  case'Pull':return loft?'PUL_AIR':ft==='B'?'PUL_BF':'PUL_FF';
  case'Hook':return loft?'HK_AIR':a<-120?'HK_FINE':'HK';
  case'Sweep':return loft?'SW_SLOG':a<-110?'SW_FINE':a>90?'SW_REV':'SW';
  case'Flick':return loft?'FL_AIR':'FL_ON';
  case'Glance':return a<-100?'GL_FINE':ft==='B'?'GL_BF':'GL_LEG';
  default:return r===0?'TP_SOFT':a>70?'TP_STEER':a<-100?'UN_LAP':'UN_ONE'}}
export function pickWicket(kind){ // batter reaction clip names (see lab clips) for dismissal kinds
 return{bowled:'batter_defend',lbw:'batter_pad_impact',caught:'batter_edge','caught behind':'batter_edge',stumped:'batter_step_out','run out':'batter_crease_dive','hit wicket':'batter_hit_wicket',obstructing:'batter_obstruct','hit twice':'batter_second_hit','timed out':'batter_walk_out','retired out':'batter_walk_out'}[String(kind||'').toLowerCase()]||'batter_walk_out'}
