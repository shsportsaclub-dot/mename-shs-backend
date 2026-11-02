// Original numeric stadium architecture; no external models or scenery images.
export function originalStadiumLayout(){
 const items=[],point=(a,r,y)=>[r*Math.cos(a),y,r*.88*Math.sin(a)];
 const box=(p,s,c,yaw=0,kind=0)=>items.push({mesh:'box',p,s,c,yaw,kind});
 const beam=(a,b,r=.09,c=[.47,.53,.56])=>items.push({mesh:'cylinder',a,b,r,c});
 const ivory=[.68,.72,.71],navy=[.035,.13,.25],blue=[.06,.3,.56];
 for(let tier=0;tier<3;tier++){
  const base=1.2+tier*9;
  for(let sector=0;sector<48;sector++){
   const angle=sector/48*Math.PI*2,yaw=-angle+Math.PI/2;
   for(let row=0;row<5;row++){
    const radius=82+tier*4.5+row*2.4,y=base+row*.92;
    box(point(angle,radius,y),[6.2,.31,1.28],ivory,yaw);
    box(point(angle,radius,y+.38),[6,.09,.8],sector%4===0?blue:[.28,.45,.62],yaw);
   }
   const front=81+tier*4.5;
   // Concourse facades close the void beneath each seating deck.
   if(tier>0){box(point(angle,front+2,base-3.1),[6.2,1.8,.75],ivory,yaw);box(point(angle,front+1,base-3.0),[5.7,.72,.14],navy,yaw);}
   box(point(angle,front,base-.7),[6.2,.7,.3],tier%2?ivory:blue,yaw);
   beam(point(angle-.065,front-.3,base+.17),point(angle+.065,front-.3,base+.17),.045,[.83,.86,.84]);
   if(sector%3===0)beam(point(angle,111,0),point(angle,111,30),.23,ivory);
  }
 }
 // Cantilever roof panels and visible radial triangular trusses.
 for(let sector=0;sector<48;sector++){
  const a=sector/48*Math.PI*2;
  box(point(a,103,29.7),[7,.18,11],sector%3===0?[.58,.63,.64]:[.75,.77,.75],-a+Math.PI/2);
  if(sector%2===0){
   beam(point(a,114,29.3),point(a,91,28.2),.12);
   beam(point(a,114,27),point(a,91,28.2),.09);
   for(let j=0;j<5;j++)beam(point(a,114-j*4.6,29.3-j*.22),point(a,111.7-j*4.6,27.15+j*.21),.05);
  }
 }
 // Four original lattice floodlight towers with banks aimed into the ground.
 for(const a of [.7,2.44,3.84,5.58]){
  const p=point(a,113,0),inward=[-Math.cos(a),0,-Math.sin(a)];
  for(const sx of [-1,1])for(const sz of [-1,1])beam([p[0]+sx*.75,0,p[2]+sz*.75],[p[0]+sx*.48,37,p[2]+sz*.48],.13);
  for(let y=0;y<36;y+=4){beam([p[0]-.7,y,p[2]-.7],[p[0]+.7,y+4,p[2]-.7],.055);beam([p[0]+.7,y,p[2]+.7],[p[0]-.7,y+4,p[2]+.7],.055);}
  for(let row=0;row<3;row++)for(let column=0;column<6;column++){
   const tangent=[Math.sin(a),0,-Math.cos(a)],x=column-2.5;
   box([p[0]+tangent[0]*x+inward[0]*.65,36+row*.65,p[2]+tangent[2]*x+inward[2]*.65],[.35,.22,.10],[.98,.94,.78],-a+Math.PI/2,4);
  }
 }
 return items;
}
export function originalCrowdPosition(index,random){
 const angle=random()*Math.PI*2,tier=index%3,row=Math.floor(random()*5),radius=82+tier*4.5+row*2.4;
 return [radius*Math.cos(angle),1.8+tier*9+row*.92,radius*.88*Math.sin(angle)];
}
