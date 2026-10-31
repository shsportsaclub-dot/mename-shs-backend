// Scoring Heroes service worker: keeps the app shell available offline. Live data is never cached here.
const V='sh-shell-v4';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['/','/manifest.webmanifest','/icon-192.png'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window'})).then(cs=>cs.forEach(c=>{try{c.navigate(c.url)}catch(e){}})))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api')||/^\/(otp|live|cric|streams|mo|wa|news|auth)/.test(u.pathname))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))))});

self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data&&e.data.text()}}
 e.waitUntil(self.registration.showNotification(d.title||'Scoring Heroes',{body:d.body||'',icon:'/icon-192.png',badge:'/icon-192.png',data:{url:d.url||'/'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=new URL((e.notification.data&&e.notification.data.url)||'/',location.origin);if(u.origin!==location.origin)return;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{const c=cs.find(x=>x.url.startsWith(location.origin));if(c){try{c.navigate(u.href)}catch(x){}return c.focus()}return self.clients.openWindow(u.href)}))});
