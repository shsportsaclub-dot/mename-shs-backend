// Small procedural expressions for stylized rigs, not a realistic facial rig.
export function cricketFaceExpression({mode='idle',time=0,seed=0,celebrate=false,dismissed=false}={}){
 const cycle=((time+seed*.137)%4.8+4.8)%4.8,blink=cycle>4.65;
 const state=dismissed||mode==='out'?'DISAPPOINTED':celebrate?'CELEBRATE':['shot','bowl'].includes(mode)?'FOCUSED':'NEUTRAL';
 return {state,eyeOpen:blink?.09:state==='FOCUSED'?.78:1,browInner:state==='DISAPPOINTED'?.007:state==='FOCUSED'?-.003:state==='CELEBRATE'?.003:0,browOuter:state==='DISAPPOINTED'?-.003:0,smile:state==='CELEBRATE'?.005:state==='DISAPPOINTED'?-.004:0,mouthOpen:state==='CELEBRATE'?.006:0};
}
