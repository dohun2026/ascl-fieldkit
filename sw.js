// ASCL 필드킷 서비스워커
// 인터넷이 되면 항상 최신 파일을 받아 쓰고(3초 안에 응답이 없으면 저장본 사용), 안 되면 저장본으로 동작합니다.
// → 앱을 수정해 올려도 이 파일은 고칠 필요가 없습니다. (저장 파일 목록이 바뀔 때만 CACHE_NAME 숫자를 올리세요)
var CACHE_NAME = 'ascl-fieldkit-1';
var FILES = [
  './', './index.html', './versions.js', './manifest.json',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './tilt/', './tilt/index.html', './tilt/xlsx.full.min.js', './tilt/exceljs.min.js', './tilt/icon.png',
  './ndt/', './ndt/index.html', './ndt/icon.png',
  './rebar/', './rebar/index.html', './rebar/icon.png'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(c){ return c.addAll(FILES); }));
  self.skipWaiting();
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
function fromNetwork(req, ms){
  return new Promise(function(resolve, reject){
    var t = setTimeout(reject, ms);
    fetch(req, {cache:'no-cache'}).then(function(res){
      clearTimeout(t);
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(req, copy); });
      }
      resolve(res);
    }, function(err){ clearTimeout(t); reject(err); });
  });
}
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  var big = /\.min\.js$|\.png$/.test(e.request.url);
  if (big) {   // 큰 라이브러리·이미지는 저장본 우선
    e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(function(c){ return c || fromNetwork(e.request, 15000); }));
    return;
  }
  e.respondWith(fromNetwork(e.request, 3000).catch(function(){
    return caches.match(e.request, {ignoreSearch:true}).then(function(c){
      return c || caches.match(new URL('./index.html', self.registration.scope).href);
    });
  }));
});
