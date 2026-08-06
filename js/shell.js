/* 관리자 공용 셸 — 기존 admin_header.php의 사이드바 + 상단바를 그대로 재현(같은 CSS 클래스).
   각 관리자 페이지가 buildShell()을 호출해 좌측 패널/상단바를 깔고 #ac(본문)를 돌려받는다. */
function shEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function buildShell(opts) {
  opts = opts || {};
  var nav = [
    { href: 'app.html', ico: '📖', name: '카달로그', key: 'catalog', match: ['catalog', 'editor'] },
    { href: 'bgm.html', ico: '🎵', name: '배경음악', key: 'bgm' },
    { href: 'submissions.html', ico: '✉️', name: '문의내역', key: 'subs' }
  ];
  var side = '<aside class="sidebar">'
    + '<div class="sb-top"><div class="sb-brand">📖 전자카달로그</div><div class="sb-admin">' + shEsc(opts.email || '') + '</div></div>'
    + '<nav class="sb-nav"><div class="sb-group">메뉴</div>'
    + nav.map(function (n) { var on = (n.key === opts.active) ? ' on' : ''; return '<a class="sb-item' + on + '" href="' + n.href + '"><span class="sb-ico">' + n.ico + '</span>' + n.name + '</a>'; }).join('')
    + '</nav></aside>';
  var main = '<div class="admin-main">'
    + '<header class="adminbar"><span class="ab-title">' + shEsc(opts.title || '') + '</span>'
    + '<div class="ab-user"><span class="muted sm">' + shEsc(opts.email || '') + '</span> <a class="ab-logout" href="#" id="shLogout">로그아웃</a></div></header>'
    + '<main class="admin-content" id="ac"></main></div>';
  document.body.className = 'admin bd-admin';
  document.body.innerHTML = side + main;
  document.getElementById('shLogout').addEventListener('click', async function (e) { e.preventDefault(); await API.signOut(); location.href = 'index.html'; });
  return document.getElementById('ac');
}
