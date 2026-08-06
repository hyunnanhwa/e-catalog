/* 문의내역 페이지 — 기존 submissions.php 스타일(sub-list) 재현. 사용자의 모든 카달로그 문의 집계 + CSV. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(dt) { return (dt || '').replace('T', ' ').slice(0, 16); }
  function csvSafe(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }

  var ac, rows = [], titleById = {};

  function exportCsv() {
    var head = ['일시', '카달로그', '이름', '회사명', '전화번호', '이메일', '내용'];
    var lines = [head.join(',')];
    rows.forEach(function (r) {
      var row = [fmt(r.created_at), titleById[r.catalog_id] || '', r.name, r.company, r.phone, r.email, (r.message || '').replace(/\n/g, ' ')]
        .map(function (v) { return '"' + csvSafe(v).replace(/"/g, '""') + '"'; });
      lines.push(row.join(','));
    });
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'inquiries_' + Date.now() + '.csv'; a.click();
  }

  function render() {
    var tools = rows.length ? '<button class="btn-sm" id="csvBtn">CSV 내보내기</button>' : '';
    var body;
    if (!rows.length) body = '<div class="sub-empty"><div class="se-ico">✉️</div><p class="muted">아직 접수된 문의가 없습니다.</p></div>';
    else body = '<ul class="sub-list">' + rows.map(function (r) {
      var c = []; if (r.phone) c.push('📞 ' + esc(r.phone)); if (r.email) c.push('✉️ <a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>');
      return '<li class="sub-item"><div class="sub-main"><div class="sub-top">'
        + '<span class="sub-name">' + esc(r.name || r.company || '(이름없음)') + '</span>'
        + (r.company && r.name ? '<span class="sub-co">' + esc(r.company) + '</span>' : '')
        + '<span class="sub-badge off">' + esc(titleById[r.catalog_id] || '') + '</span>'
        + '<span class="sub-date muted">' + esc(fmt(r.created_at)) + '</span></div>'
        + (c.length ? '<div class="sub-contacts">' + c.join('<span></span>') + '</div>' : '')
        + (r.message ? '<div class="sub-msg">' + esc(r.message) + '</div>' : '')
        + '</div></li>';
    }).join('') + '</ul>';

    ac.innerHTML = '<section class="card"><div class="sub-head"><div>'
      + '<h2 class="sub-h2">문의 접수 <span class="muted">(' + rows.length + '건)</span></h2>'
      + '<p class="muted sm">메일폼으로 접수된 문의입니다. (내 모든 카달로그 합산)</p></div>'
      + '<div class="sub-tools">' + tools + '</div></div>' + body + '</section>';
    var cb = document.getElementById('csvBtn'); if (cb) cb.addEventListener('click', exportCsv);
  }

  (async function () {
    var u = await API.requireUser();
    ac = buildShell({ active: 'subs', title: '문의내역', email: u.email });
    ac.innerHTML = '<div class="card"><p class="muted">불러오는 중…</p></div>';
    try {
      var cats = await API.myCatalogs();
      cats.forEach(function (c) { titleById[c.id] = c.title; });
      var ids = cats.map(function (c) { return c.id; });
      rows = ids.length ? await API.myInquiries(ids) : [];
      render();
    } catch (e) { ac.innerHTML = '<div class="card"><p class="err">' + (e.message || e) + '</p></div>'; }
  })();
})();
