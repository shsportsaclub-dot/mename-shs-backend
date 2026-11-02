// Versioned original SH asset format, not glTF. No executable code in model files.
const avatarRound=x=>Math.round(x*1e6)/1e6;
const avatarArray=(a)=>Array.from(a,avatarRound);
const avatarId=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(s);
export function buildAvatarModel(withoutHelmet,withHelmet,{kitTexture=null}={}){
 const meshes=new Map(),materials=[],materialIds=new Map();
 const convert=snapshot=>snapshot.parts.map(part=>{
  const geometry=snapshot.geometries[part.mesh];if(!geometry)throw Error('Missing captured geometry');
  if(!meshes.has(part.mesh)){const m={id:part.mesh,positions:avatarArray(geometry.p),normals:avatarArray(geometry.n),indices:Array.from(geometry.i)};if(geometry.l&&geometry.l!==geometry.p)m.surfaceCoordinates=avatarArray(geometry.l);meshes.set(part.mesh,m);}
  const material={color:avatarArray(part.color),roughness:avatarRound(part.roughness),shader:part.shader},key=JSON.stringify(material);
  if(!materialIds.has(key)){const id='material-'+materials.length;materialIds.set(key,id);materials.push({id,...material});}
  return {mesh:part.mesh,material:materialIds.get(key),matrix:avatarArray(part.matrix)};
 });
 const off=convert(withoutHelmet),on=convert(withHelmet),counts=new Map(),key=p=>JSON.stringify(p);
 for(const p of on)counts.set(key(p),(counts.get(key(p))??0)+1);
 const common=[],offOnly=[];for(const p of off){const k=key(p),n=counts.get(k)??0;if(n){common.push({...p,variant:'always'});counts.set(k,n-1);}else offOnly.push({...p,variant:'helmet-off'});}
 const onOnly=[];for(const p of on){const k=key(p),n=counts.get(k)??0;if(n){onOnly.push({...p,variant:'helmet-on'});counts.set(k,n-1);}}
 const model={format:'sh-avatar-model',version:1,name:'Scoring Heroes Original Avatar',units:'metres',coordinateSystem:{up:'+Y',front:'+Z'},authorship:'Original authored procedural geometry',visualQuality:'stylized',pose:{type:'static',name:'bat-holding inspection'},skin:null,animations:[],meshes:[...meshes.values()],materials,parts:[...common,...offOnly,...onOnly],textures:kitTexture?{kit:{mimeType:'image/png',uri:kitTexture}}:{}};
 validateAvatarModel(model);return model;
}
export function validateAvatarModel(model){
 const fail=message=>{throw Error('Invalid avatar model: '+message);},array=(a,n,max,label)=>{if(!Array.isArray(a)||a.length!==n||n>max||!a.every(Number.isFinite))fail(label);};
 if(!model||model.format!=='sh-avatar-model'||model.version!==1||model.units!=='metres')fail('unsupported format/version/units');
 if(model.coordinateSystem?.up!=='+Y'||model.coordinateSystem?.front!=='+Z')fail('coordinate system');
 if(model.pose?.type!=='static'||model.skin!==null||!Array.isArray(model.animations)||model.animations.length)fail('v1 supports static geometry only');
 if(!Array.isArray(model.meshes)||!model.meshes.length||model.meshes.length>100||!Array.isArray(model.materials)||!model.materials.length||model.materials.length>200||!Array.isArray(model.parts)||!model.parts.length||model.parts.length>5000)fail('mesh/material/part budget');
 const meshes=new Map(),materials=new Set();let vertices=0;
 for(const m of model.meshes){if(!avatarId(m.id)||meshes.has(m.id))fail('mesh id');const count=m.positions?.length/3;if(!Number.isInteger(count)||count<3||count>65535)fail('vertex count');vertices+=count;if(vertices>250000)fail('total vertex budget');array(m.positions,count*3,65535*3,'positions');array(m.normals,count*3,65535*3,'normals');if(m.positions.some(x=>Math.abs(x)>5))fail('position bounds');for(let k=0;k<m.normals.length;k+=3)if(Math.abs(Math.hypot(...m.normals.slice(k,k+3))-1)>.03)fail('normal length');if(m.surfaceCoordinates)array(m.surfaceCoordinates,count*3,65535*3,'surface coordinates');if(!Array.isArray(m.indices)||!m.indices.length||m.indices.length%3||m.indices.length>1500000||!m.indices.every(i=>Number.isInteger(i)&&i>=0&&i<count))fail('triangle indices');meshes.set(m.id,m);}
 for(const m of model.materials){if(!avatarId(m.id)||materials.has(m.id))fail('material id');array(m.color,3,3,'material color');if(m.color.some(x=>x<0||x>1)||!Number.isFinite(m.roughness)||m.roughness<0||m.roughness>1||!Number.isInteger(m.shader)||m.shader<0||m.shader>15)fail('material');materials.add(m.id);}
 for(const p of model.parts){if(!meshes.has(p.mesh)||!materials.has(p.material)||!['always','helmet-on','helmet-off'].includes(p.variant))fail('part reference/variant');array(p.matrix,16,16,'part matrix');const m=p.matrix,det=m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5]);if(m[3]!==0||m[7]!==0||m[11]!==0||m[15]!==1||Math.abs(det)<1e-16||m.some(x=>Math.abs(x)>10))fail('affine transform');const columns=[m.slice(0,3),m.slice(4,7),m.slice(8,11)];for(const [i,j]of [[0,1],[0,2],[1,2]])if(Math.abs(columns[i].reduce((n,x,k)=>n+x*columns[j][k],0))/(Math.hypot(...columns[i])*Math.hypot(...columns[j]))>.005)fail('v1 does not support shear');}
 const texture=model.textures?.kit;if(texture&&(texture.mimeType!=='image/png'||typeof texture.uri!=='string'||texture.uri.length>1500000||!/^data:image\/png;base64,iVBORw0KGgo/.test(texture.uri)))fail('embedded PNG texture');
 if(texture){let header;try{header=atob(texture.uri.split(',')[1].slice(0,48));}catch{fail('PNG encoding');}if(header.length<24||header.slice(12,16)!=='IHDR')fail('PNG header');const dimension=start=>[0,1,2,3].reduce((n,i)=>n*256+header.charCodeAt(start+i),0),w=dimension(16),h=dimension(20);if(!w||!h||w>2048||h>2048)fail('PNG dimensions');}
 if(model.materials.some(m=>m.shader===8||m.shader===9)&&!texture)fail('kit texture is required by material');return true;
}
