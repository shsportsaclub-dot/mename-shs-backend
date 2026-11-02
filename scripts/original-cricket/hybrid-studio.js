// Browser source lifecycle. No media uploads and no automatic score events from speech.
(function(){
 const video=$('#hybridVideo');if(!video)return;
 const badge=$('#hybridMode'),status=$('#hybridStatus'),captionStatus=$('#captionStatus'),overlay=$('#hybridSkeleton'),ctx=overlay.getContext('2d'),buffer=new HybridPoseBuffer();
 let captionLoad=0;let sourceGeneration=0;let sourceStream=null,sourceURL=null,sourceKind=null,worker=null,workerURL=null,ready=false,busy=false,inferenceTimer=0,epoch=0,lastFrameTime=-1,lastRole=null,trackingWanted=false,pendingCapture=false,cues=[],captionOverride=null,lastCaption='',recognition=null,micStream=null,micAudio=null,listenGeneration=0,crop={x:0,y:0,w:1,h:1},drag=null,latestLandmarks=null;
 const sourceTime=()=>Number.isFinite(video.currentTime)?video.currentTime:0;
 const hasVideo=()=>!!sourceKind&&video.readyState>=2;
 const say=text=>{status.textContent=text;};
 function drawOverlay(){
  if(!ctx)return;overlay.width=video.videoWidth||640;overlay.height=video.videoHeight||360;const W=overlay.width,H=overlay.height;ctx.clearRect(0,0,W,H);
  if(crop.w<.99||crop.h<.99){ctx.strokeStyle='#f1cd71';ctx.lineWidth=Math.max(2,W/320);ctx.strokeRect(crop.x*W,crop.y*H,crop.w*W,crop.h*H);}
  if(!latestLandmarks)return;const p=latestLandmarks,xy=i=>[(crop.x+p[i].x*crop.w)*W,(crop.y+p[i].y*crop.h)*H];ctx.strokeStyle='#75efd3';ctx.lineWidth=Math.max(2,W/250);
  for(const [a,b]of [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]])if(p[a]?.visibility>=.55&&p[b]?.visibility>=.55){ctx.beginPath();ctx.moveTo(...xy(a));ctx.lineTo(...xy(b));ctx.stroke();}
 }
 function clearMotion(){epoch++;busy=false;lastFrameTime=-1;lastRole=null;latestLandmarks=null;buffer.reset();window.SHCricket.clearTracking();badge.textContent='ILLUSTRATIVE · NO VALID POSE';drawOverlay();}
 function clearCaption(){captionOverride=null;lastCaption='';window.SHCricket.setSourceCaption('');}
 function stopTracker(){trackingWanted=false;clearTimeout(inferenceTimer);if(worker)worker.terminate();worker=null;if(workerURL)URL.revokeObjectURL(workerURL);workerURL=null;ready=false;clearMotion();$('#hybridTrack').disabled=false;$('#hybridTrack').textContent='Start body tracking';}
 function stopListening(){listenGeneration++;try{recognition?.abort();}catch{}recognition=null;for(const t of micStream?.getTracks()||[])t.stop();micStream=null;if(micAudio){micAudio.pause();micAudio.srcObject=null;}micAudio=null;$('#hybridMic').textContent='Start commentary mic';captionStatus.textContent='Microphone stopped.';}
 function stopSource(){sourceGeneration++;captionLoad++;stopTracker();stopListening();video.pause();for(const t of sourceStream?.getTracks()||[])t.stop();sourceStream=null;video.srcObject=null;video.removeAttribute('src');video.load();if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL=null;sourceKind=null;cues=[];crop={x:0,y:0,w:1,h:1};clearCaption();say('Source stopped. Scorer animation remains available.');}
 async function setFile(file){if(!file)return;stopSource();sourceURL=URL.createObjectURL(file);sourceKind='file';video.muted=false;video.src=sourceURL;video.load();say('Video loaded. Press Play, crop to one person, then Start body tracking.');}
 async function capture(kind){if(pendingCapture)return;pendingCapture=true;stopSource();const attempt=sourceGeneration;
  try{const media=navigator.mediaDevices;if(!media)throw Error('Camera/screen capture needs HTTPS or localhost.');const stream=kind==='camera'?await media.getUserMedia({video:{width:{ideal:1280}},audio:false}):await media.getDisplayMedia({video:true,audio:true});if(sourceGeneration!==attempt){stream.getTracks().forEach(t=>t.stop());return;}sourceStream=stream;sourceKind=kind;video.muted=kind==='camera';video.srcObject=stream;for(const t of stream.getVideoTracks())t.addEventListener('ended',()=>{if(sourceStream===stream)stopSource();},{once:true});await video.play();say(kind==='camera'?'Camera connected; its microphone is off.':'Shared source connected. Original audio is available only if included in sharing.');}
  catch(e){if(sourceGeneration===attempt)say('Source unavailable: '+e.message);}finally{pendingCapture=false;}
 }
 async function startTracker(){if(trackingWanted){stopTracker();say('Tracking stopped. Scorer animation is illustrative.');return;}if(!hasVideo()){say('Load and play a video source first.');return;}if(!globalThis.Worker||!globalThis.createImageBitmap){say('Body tracking needs Worker and ImageBitmap support.');return;}
  stopTracker();trackingWanted=true;$('#hybridTrack').textContent='Stop body tracking';say('Loading optional free pose tracker… internet required for first load.');
  try{workerURL=URL.createObjectURL(new Blob([HYBRID_TRACKER_WORKER],{type:'text/javascript'}));worker=new Worker(workerURL);const instance=worker;worker.onerror=e=>{stopTracker();say('Tracker unavailable: '+(e.message||'worker blocked'));};worker.onmessage=({data:m})=>{if(worker!==instance)return;
   if(m.type==='ready'){if(!trackingWanted)return;ready=true;say('Tracker ready. Crop to one person and choose their avatar role.');pump();}
   else if(m.type==='error'){stopTracker();say('Tracking failed: '+m.message+' · Source playback is still available.');}
   else if(m.type==='pose'){if(m.epoch!==epoch)return;busy=false;const pose=m.world&&retargetCricketPose(m.world);latestLandmarks=pose?m.landmarks:null;if(pose)buffer.push(m.time,m.world,performance.now());else{buffer.reset();window.SHCricket.clearTracking();}drawOverlay();}
  };worker.postMessage({type:'init'});
  }catch(e){stopTracker();say('Tracker unavailable: '+e.message);}
 }
 async function pump(){clearTimeout(inferenceTimer);if(!trackingWanted||!ready||!worker)return;
  if(!busy&&hasVideo()&&!video.paused&&!video.seeking&&Math.abs(sourceTime()-lastFrameTime)>.035){
   const stamp=sourceTime(),frameEpoch=epoch,W=video.videoWidth,H=video.videoHeight;busy=true;lastFrameTime=stamp;
   try{const sw=Math.max(1,Math.floor(W*crop.w)),sh=Math.max(1,Math.floor(H*crop.h));const bitmap=await createImageBitmap(video,Math.floor(W*crop.x),Math.floor(H*crop.y),sw,sh,{resizeWidth:Math.min(640,sw),resizeHeight:Math.max(1,Math.round(sh*Math.min(1,640/sw)))});if(!worker||frameEpoch!==epoch){bitmap.close();busy=false;}else worker.postMessage({type:'frame',bitmap,epoch:frameEpoch,time:stamp,stamp:performance.now()},[bitmap]);}
   catch(e){busy=false;stopTracker();say('Video cannot be analysed: '+e.message+' · For a URL, the media server must allow CORS.');}
  }
  if(trackingWanted)inferenceTimer=setTimeout(pump,100);
 }
 function tick(){
  const time=sourceTime(),role=$('#hybridRole').value,playerId=window.SHCricket.getRoles()[role];if(playerId!==lastRole){clearMotion();lastRole=playerId;}
  const pose=trackingWanted&&ready&&!video.paused&&!video.seeking?buffer.sample(time,performance.now()):null;
  if(pose&&playerId){const r=window.SHCricket.applyTrackedPose(playerId,pose);badge.textContent=r.accepted?'VIDEO BODY ESTIMATE · '+role.toUpperCase()+' · BALL / FIELD ILLUSTRATIVE':'ILLUSTRATIVE · NO VALID POSE';}else{window.SHCricket.clearTracking();badge.textContent='ILLUSTRATIVE · NO VALID POSE';}
  $('#hybridStageMode').style.display=sourceKind?'block':'none';$('#hybridStageMode').textContent=badge.textContent;
  $('#hybridClock').textContent=sourceKind?time.toFixed(2)+' s · '+(video.paused?'PAUSED':sourceKind.toUpperCase()):'No source';
  if(captionOverride&&performance.now()>captionOverride.until)captionOverride=null;
  const timed=cues.length?hybridCaptionAt(cues,time+Number($('#hybridOffset').value||0)):'';const text=captionOverride?.text??timed;
  if(text!==lastCaption){lastCaption=text;const hint=window.SHCricket.setSourceCaption(text);$('#hybridHint').textContent=text?(hint.region||'No direction')+' · '+(hint.resultHint||hint.phase||'Caption only')+' · score unchanged':'Commentary hints never change the scorer score.';}
 }
 function caption(text){captionOverride={text:String(text).slice(0,1000),until:performance.now()+8000};lastCaption='';tick();return parseCricketCaption(text);}
 async function startMic(){if(recognition||micStream){stopListening();return;}const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Speech){captionStatus.textContent='Speech recognition unavailable in this browser. Use typed captions or a VTT file.';return;}const generation=++listenGeneration;
  try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone needs HTTPS or localhost.');const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(generation!==listenGeneration){stream.getTracks().forEach(t=>t.stop());return;}micStream=stream;
   // Explicit radio monitor, off by default to avoid feedback. Headphones recommended.
   micAudio=document.createElement('audio');micAudio.srcObject=stream;micAudio.muted=!$('#hybridMonitor').checked;if(!micAudio.muted)await micAudio.play();if(generation!==listenGeneration)return;
   recognition=new Speech();recognition.lang=$('#hybridLanguage').value;recognition.continuous=true;recognition.interimResults=false;recognition.onresult=e=>{if(generation!==listenGeneration)return;for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)caption(e.results[i][0].transcript);};recognition.onerror=e=>{if(generation!==listenGeneration)return;stopListening();captionStatus.textContent='Speech unavailable: '+e.error+' · use typed captions / VTT.';};recognition.onend=()=>{if(generation===listenGeneration)stopListening();};recognition.start();$('#hybridMic').textContent='Stop commentary mic';captionStatus.textContent='Listening. Browser speech service may process audio online. Original video audio is separate.';
  }catch(e){if(generation!==listenGeneration)return;stopListening();captionStatus.textContent='Microphone unavailable: '+e.message;}
 }
 $('#hybridFile').onchange=e=>setFile(e.target.files?.[0]);
 $('#hybridUrlLoad').onclick=()=>{try{const u=new URL($('#hybridUrl').value);if(!['https:','http:'].includes(u.protocol)||/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname))throw Error('Use a direct browser-playable media URL, not a YouTube page.');stopSource();sourceKind='url';video.crossOrigin='anonymous';video.muted=false;video.src=u.href;video.load();say('Direct media loaded. Playback and frame access depend on server CORS / codec support.');}catch(e){say(e.message);}};
 $('#hybridCamera').onclick=()=>capture('camera');$('#hybridScreen').onclick=()=>capture('screen');$('#hybridStop').onclick=stopSource;$('#hybridTrack').onclick=startTracker;
 $('#hybridRole').onchange=()=>{clearMotion();say('Avatar role changed. Crop to the matching person in the video.');};
 $('#hybridVtt').onchange=async e=>{const generation=sourceGeneration,load=++captionLoad;try{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000)throw Error('Caption file must be smaller than 2 MB');const text=await f.text();if(generation!==sourceGeneration||load!==captionLoad)return;cues=parseHybridVtt(text);clearCaption();say(cues.length+' timed captions loaded for this video.');tick();}catch(e){if(generation===sourceGeneration&&load===captionLoad)say(e.message);}};
 $('#hybridCaptionSend').onclick=()=>caption($('#hybridCaption').value);$('#hybridMic').onclick=startMic;
 $('#hybridMonitor').onchange=()=>{if(micAudio){micAudio.muted=!$('#hybridMonitor').checked;if(!micAudio.muted)micAudio.play().catch(e=>{captionStatus.textContent=e.message;});}};
 $('#hybridCropSelect').onclick=()=>{overlay.parentElement.classList.toggle('cropping');say('Drag a rectangle over one person. Click Select person crop again to return to video controls.');};
 $('#hybridCropReset').onclick=()=>{crop={x:0,y:0,w:1,h:1};clearMotion();};
 const point=e=>{const r=overlay.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};};
 overlay.onpointerdown=e=>{drag=point(e);overlay.setPointerCapture(e.pointerId);};overlay.onpointerup=e=>{if(!drag)return;const p=point(e),next={x:Math.min(p.x,drag.x),y:Math.min(p.y,drag.y),w:Math.abs(p.x-drag.x),h:Math.abs(p.y-drag.y)};drag=null;if(next.w>.05&&next.h>.05){crop=next;overlay.parentElement.classList.remove('cropping');clearMotion();say('Crop selected. Only the person inside this area will be analysed.');}};
 for(const event of ['seeking','pause','ended','emptied','waiting','stalled'])video.addEventListener(event,()=>{clearMotion();if(event==='seeking'||event==='emptied'){clearCaption();tick();}});
 video.addEventListener('loadedmetadata',drawOverlay);video.addEventListener('error',()=>{stopTracker();say('Video could not load. Check the file, direct URL, CORS and codec.');});
 const studioButton=document.createElement('button');studioButton.textContent='SOURCE STUDIO';studioButton.onclick=()=>{document.body.classList.toggle('studioOpen');$('#hybridControls').open=true;};$('.view').append(studioButton);
 if(new URLSearchParams(location.search).get('studio')==='1'){document.body.classList.add('studioOpen');$('#hybridControls').open=true;}
 const timer=setInterval(tick,80);window.addEventListener('pagehide',()=>{clearInterval(timer);stopSource();},{once:true});
 window.SHHybridStudio={caption,stop:stopSource,stopTracker,getState:()=>({source:sourceKind,time:sourceTime(),tracking:trackingWanted,ready,crop:{...crop},cues:cues.length,scoreAuthority:'SCORER_ONLY'})};
})();
