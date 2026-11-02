// Dedicated offline asset inspection; no scoring or source-tracking connection.
manual=true;active=null;presentation=null;
const avatarPanel=document.createElement('section');avatarPanel.className='avatarPanel';
avatarPanel.innerHTML='<div class="avatarBrand">SCORING HEROES <span>ORIGINAL AVATAR · CODE RENDER</span></div><div class="avatarTools"><button data-avatar-view="portrait">Face close-up</button><button data-avatar-view="body">Full body + bat</button><button id="avatarHelmet">Helmet off</button><label>Rotate <input id="avatarRotate" type="range" min="-180" max="180" value="13" aria-label="Avatar rotation"></label></div><p>One original coded character · no purchased models · generic identity</p>';
document.body.append(avatarPanel);
window.SHAvatar={setView(view){if(!['portrait','body'].includes(view))return false;avatarStudyState.view=view;draw();return true;},setYaw(degrees){if(!Number.isFinite(degrees))return false;avatarStudyState.yaw=degrees*Math.PI/180;draw();return true;},setHelmet(value){avatarStudyState.helmet=!!value;document.querySelector('#avatarHelmet').textContent=value?'Helmet on':'Helmet off';draw();},getState(){return {characterCount:1,heightMetres:1.85,view:avatarStudyState.view,yawDegrees:avatarStudyState.yaw*180/Math.PI,helmet:avatarStudyState.helmet,originalGeometry:true,identity:'generic-original',renderer:gl.getParameter(gl.VERSION)};}};
for(const b of document.querySelectorAll('[data-avatar-view]'))b.onclick=()=>SHAvatar.setView(b.dataset.avatarView);
document.querySelector('#avatarRotate').oninput=e=>SHAvatar.setYaw(Number(e.target.value));document.querySelector('#avatarHelmet').onclick=()=>SHAvatar.setHelmet(!avatarStudyState.helmet);
addEventListener('resize',()=>draw());draw();
