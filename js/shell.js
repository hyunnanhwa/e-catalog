/* 관리자 공용 셸 (2026-09 · cms-dev 디자인 이식) — .app/.side/.top 구조 + 테마토글.
   buildShell({active,title,email}) → 콘텐츠 컨테이너(#ac=.view) 반환. 기능은 데모 고유. */
function shEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
var SH_ICON = (function(){
  var s='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var m={
    board:'<path d="M3 7h18M3 12h18M3 17h18"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    media:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    wand:'<path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4z"/><path d="M18.5 14l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/>',
    set:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
  };
  return function(k){ return m[k]?s+m[k]+'</svg>':''; };
})();

function buildShell(opts) {
  opts = opts || {};
  try { var _t=localStorage.getItem('ecat-admin-theme'); if(_t) document.documentElement.setAttribute('data-theme',_t); } catch(e){}
  var groups = [
    { label: '카달로그', items: [
      { href: 'app.html', ico: 'board', name: '카달로그', key: 'catalog' },
      { href: 'backups.html', ico: 'clock', name: '편집 백업', key: 'backups' },
      { href: 'submissions.html', ico: 'inbox', name: '문의내역', key: 'subs' },
      { href: 'chats.html', ico: 'inbox', name: 'AI 채팅', key: 'chats' },
      { href: 'media.html', ico: 'media', name: '미디어', key: 'media' }
    ]},
    { label: '이미지 도구', items: [
      { href: 'tools.html', ico: 'wand', name: '이미지 도구', key: 'tools' }
    ]},
    { label: '설정', items: [
      { href: 'settings.html', ico: 'set', name: '환경설정', key: 'settings' }
    ]}
  ];
  var nav = groups.map(function (g) {
    return '<div class="grp">' + shEsc(g.label) + '</div>' + g.items.map(function (n) {
      return '<a href="' + n.href + '" class="' + (n.key === opts.active ? 'on' : '') + '">' + SH_ICON(n.ico) + shEsc(n.name) + '</a>';
    }).join('');
  }).join('');
  var email = opts.email || '';
  var side = '<aside class="side" id="sidebar">'
    + '<a class="site-box" href="app.html" title="카달로그 관리"><div class="logo">전</div>'
    + '<div style="min-width:0"><div class="nm">전자카달로그</div><div class="dm">데모 관리자</div></div></a>'
    + '<nav class="nav">' + nav + '</nav>'
    + '<div class="side-foot"><div class="avatar">' + shEsc((email || 'U').charAt(0).toUpperCase()) + '</div>'
    + '<div style="min-width:0"><div class="who">' + shEsc(email || '데모') + '</div><div class="role">관리자</div></div>'
    + '<a class="out" href="#" id="shLogout">로그아웃</a></div></aside>';
  var demoBadge = (window.API && window.API.__demo)
    ? '<span class="badge b-warn plain" title="Supabase 미설정 — 이 브라우저에만 저장되는 체험모드입니다.">🧪 데모모드</span>' : '';
  var main = '<div class="main">'
    + '<header class="top">'
    + '<button type="button" class="iconbtn hamb" id="navToggle" aria-label="메뉴"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>'
    + '<div class="crumb"><b>' + shEsc(opts.title || '') + '</b></div><div class="sp"></div>'
    + demoBadge
    + '<button type="button" class="iconbtn" id="themeToggle" title="밝게/어둡게">' + SH_ICON('moon') + '</button>'
    + '</header>'
    + '<section class="view" id="ac"></section></div>';
  document.body.className = 'cms';
  document.body.innerHTML = '<div class="app">' + side
    + '<div class="sb-backdrop" id="navBackdrop" hidden style="position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:35"></div>'
    + main + '</div>';
  // 로그아웃
  document.getElementById('shLogout').addEventListener('click', async function (e) { e.preventDefault(); await API.signOut(); location.href = 'index.html'; });
  // 테마 토글
  var tt = document.getElementById('themeToggle');
  tt.addEventListener('click', function () {
    var d = document.documentElement, on = d.getAttribute('data-theme') === 'dark';
    if (on) d.removeAttribute('data-theme'); else d.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('ecat-admin-theme', on ? 'light' : 'dark'); } catch (e) {}
  });
  // 모바일 사이드바
  var nt = document.getElementById('navToggle'), bk = document.getElementById('navBackdrop');
  if (nt) nt.addEventListener('click', function () { var o = document.body.classList.toggle('nav-open'); if (bk) bk.hidden = !o; });
  if (bk) bk.addEventListener('click', function () { document.body.classList.remove('nav-open'); bk.hidden = true; });
  return document.getElementById('ac');
}
