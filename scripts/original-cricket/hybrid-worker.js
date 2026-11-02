// Optional free MediaPipe dependency; loaded only after the operator starts tracking.
let detector=null;
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='init'){
   const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs');
   const files=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
   detector=await vision.PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,minTrackingConfidence:.6});
   self.postMessage({type:'ready'});
  }else if(m.type==='frame'){
   try{if(!detector)throw Error('Tracker is not ready');const r=detector.detectForVideo(m.bitmap,m.stamp);self.postMessage({type:'pose',epoch:m.epoch,time:m.time,world:r.worldLandmarks[0]??null,landmarks:r.landmarks[0]??null});}finally{m.bitmap?.close();}
  }
 }catch(e){self.postMessage({type:'error',message:String(e.message||e).slice(0,200)});}
};
