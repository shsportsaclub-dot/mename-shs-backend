export function inspectRig(root){
 const result={bones:0,meshes:0,skinnedMeshes:0,weightedMeshes:0,vertices:0,clips:(root.animations||[]).map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length}))};
 root.traverse(n=>{if(n.isBone)result.bones++;if(n.isMesh||n.isSkinnedMesh){result.meshes++;result.vertices+=n.geometry?.attributes?.position?.count||0;}if(n.isSkinnedMesh){result.skinnedMeshes++;if(n.geometry?.attributes?.skinIndex&&n.geometry?.attributes?.skinWeight)result.weightedMeshes++;}});return result;
}
export function disposeRig(root){const resources=new Set();root.traverse(n=>{if(n.skeleton?.dispose)resources.add(n.skeleton);if(n.geometry)resources.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);}});for(const r of resources)r.dispose();}

export function playableClips(root){return (root.animations||[]).filter(c=>c.duration>0&&c.tracks.length>0);}

export function withTemporaryObjectURLs(urlAPI,parse){const original=urlAPI.createObjectURL,urls=[];urlAPI.createObjectURL=function(...args){const url=original.apply(this,args);urls.push(url);return url;};try{return parse();}finally{urlAPI.createObjectURL=original;for(const url of urls)urlAPI.revokeObjectURL(url);}}
