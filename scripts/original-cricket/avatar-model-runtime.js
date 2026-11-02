// Captures only instances added by the single study character, never the stadium.
function captureAvatarInstances(before){
 const geometries=Object.create(null),parts=[];
 for(const [name,mesh]of Object.entries(meshes))for(let k=before.get(name)??0;k<mesh.list.length;k+=21){
  if(!mesh.cpu)throw Error('Missing mesh data: '+name);geometries[name]=mesh.cpu;
  parts.push({mesh:name,matrix:mesh.list.slice(k,k+16),color:mesh.list.slice(k+16,k+19),roughness:mesh.list[k+19],shader:mesh.list[k+20]});
 }
 return {geometries,parts};
}
function exportAvatarModelData(){
 if(!avatarStudyMode)throw Error('Avatar export is study-only');
 if(avatarLoadedAsset)return JSON.parse(JSON.stringify(avatarLoadedAsset.data));
 if(globalThis.SH_AVATAR_JSON_ONLY)throw Error('Load a model JSON first');
 const saved={...avatarStudyState};let off,on;
 try{avatarStudyState.yaw=0;avatarCaptureRequested=true;avatarStudyState.helmet=false;draw();off=avatarLastSnapshot;avatarStudyState.helmet=true;draw();on=avatarLastSnapshot;
  const model=buildAvatarModel(off,on,{kitTexture:kitCanvas.toDataURL('image/png')});if(nativeStudyHead()){model.authorship='SH adaptation of CC0 MakeHuman head topology; original equipment and procedural parts';model.sourceProvenance=nativeStudyHead().provenance;}return model;
 }finally{Object.assign(avatarStudyState,saved);avatarCaptureRequested=false;avatarLastSnapshot=null;draw();}
}
function releaseAvatarModel(asset){
 if(!asset)return;for(const name of asset.names.values()){const mesh=meshes[name];if(!mesh)continue;for(const buffer of [...Object.values(mesh.buffers),mesh.indexBuffer,mesh.instances])gl.deleteBuffer(buffer);gl.deleteVertexArray(mesh.vao);delete meshes[name];}if(asset.texture)gl.deleteTexture(asset.texture);
}
async function loadAvatarModelData(input){
 if(!avatarStudyMode)throw Error('JSON model loading is study-only');validateAvatarModel(input);
 const data=JSON.parse(JSON.stringify(input)),ticket=++avatarLoadTicket;let image=null;
 if(data.textures?.kit)image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Invalid embedded kit image'));img.src=data.textures.kit.uri;});
 if(ticket!==avatarLoadTicket)return {accepted:false,reason:'REPLACED_LOAD'};
 const textureLimit=Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||2048;
 if(image&&(!image.naturalWidth||!image.naturalHeight||image.naturalWidth>Math.min(2048,textureLimit)||image.naturalHeight>Math.min(2048,textureLimit)))throw Error('Embedded texture exceeds renderer dimensions');
 if(gl.getError()!==gl.NO_ERROR)throw Error('Renderer has a pending GPU error; current model retained');
 const epoch=avatarAssetEpoch+1,asset={data,names:new Map(),materials:new Map(data.materials.map(m=>[m.id,m])),texture:null};
 try{
  for(const mesh of data.meshes){const name='json-avatar-'+epoch+'-'+mesh.id;installCricketMesh(name,{p:mesh.positions,n:mesh.normals,i:mesh.indices,l:mesh.surfaceCoordinates},true);asset.names.set(mesh.id,name);}
  if(image){asset.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,asset.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
  const gpuError=gl.getError();if(gpuError!==gl.NO_ERROR)throw Error('Model GPU upload failed: '+gpuError);
 }catch(error){releaseAvatarModel(asset);throw error;}
 const previous=avatarLoadedAsset;avatarLoadedAsset=asset;avatarAssetEpoch=epoch;releaseAvatarModel(previous);draw();return {accepted:true,meshes:data.meshes.length,parts:data.parts.length};
}
function drawAvatarModel(){
 const asset=avatarLoadedAsset,rotation=matrix([0,0,0],[1,1,1],avatarStudyState.yaw);
 for(const part of asset.data.parts){if(part.variant==='helmet-on'&&!avatarStudyState.helmet||part.variant==='helmet-off'&&avatarStudyState.helmet)continue;const material=asset.materials.get(part.material);add(asset.names.get(part.mesh),multiply(rotation,part.matrix),material.color,material.roughness,material.shader);}
}
