/* 관리자 공용 셸 — 기존 admin_header.php의 그룹형 사이드바 + 상단바를 그대로 재현(같은 CSS 클래스). */
function shEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function buildShell(opts) {
  opts = opts || {};
  var groups = [
    { label: '카달로그', items: [
      { href: 'app.html', ico: '📖', name: '카달로그', key: 'catalog' },
      { href: 'backups.html', ico: '🗂️', name: '편집 백업', key: 'backups' },
      { href: 'submissions.html', ico: '✉️', name: '문의내역', key: 'subs' },
      { href: 'media.html', ico: '🖼️', name: '미디어', key: 'media' }
    ]},
    { label: '이미지 도구', items: [
      { href: 'tools.html', ico: '🛠️', name: '이미지 도구', key: 'tools' }
    ]},
    { label: '설정', items: [
      { href: 'settings.html', ico: '⚙️', name: '환경설정', key: 'settings' }
    ]}
  ];
  var nav = groups.map(function (g) {
    return '<div class="sb-group">' + shEsc(g.label) + '</div>' + g.items.map(function (n) {
      var on = (n.key === opts.active) ? ' on' : '';
      return '<a class="sb-item' + on + '" href="' + n.href + '"><span class="sb-ico">' + n.ico + '</span>' + n.name + '</a>';
    }).join('');
  }).join('');
  var side = '<aside class="sidebar">'
    + '<div class="sb-top"><div class="sb-brand">📖 전자카달로그</div><div class="sb-admin">' + shEsc(opts.email || '') + '</div></div>'
    + '<nav class="sb-nav">' + nav + '</nav></aside>';
  var main = '<div class="admin-main">'
    + '<header class="adminbar"><span class="ab-title">' + shEsc(opts.title || '') + '</span>'
    + '<div class="ab-user"><span class="muted sm">' + shEsc(opts.email || '') + '</span> <a class="ab-logout" href="#" id="shLogout">로그아웃</a></div></header>'
    + '<main class="admin-content" id="ac"></main></div>';
  document.body.className = 'admin bd-admin';
  document.body.innerHTML = side + main;
  document.getElementById('shLogout').addEventListener('click', async function (e) { e.preventDefault(); await API.signOut(); location.href = 'index.html'; });
  return document.getElementById('ac');
}
