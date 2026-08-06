/* 마이페이지(카달로그 대시보드) — 기존 admin 사이드바 + catalogs.php cx-card 그대로. 게시 버튼 없음. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shareUrl(id) { return location.href.replace(/app\.html.*$/, '') + 'view.html?id=' + id; }

  function card(c) {
    return '<div class="cx-card" data-id="' + c.id + '">'
      + '<div class="cx-card-head"><span class="cx-flag">📖</span><div class="cx-card-info">'
      + '<div class="cx-card-title">' + esc(c.title) + '</div>'
      + '<div class="cx-card-meta"><span>비율 ' + esc(c.aspect || '16:9') + '</span></div></div></div>'
      + '<div class="cx-actions">'
      + '<a class="cx-btn primary" href="editor.html?id=' + c.id + '">🎨 편집</a>'
      + '<a class="cx-btn" href="bgm.html?id=' + c.id + '">🎵 배경음악</a>'
      + '<a class="cx-btn" href="view.html?id=' + c.id + '" target="_blank">👁 미리보기</a>'
      + '<button class="cx-btn" data-act="share">🔗 링크복사</button>'
      + '<button class="cx-btn" data-act="inq">✉️ 문의내역</button>'
      + '<button class="cx-btn" data-act="rename">✏️ 이름</button>'
      + '<button class="cx-btn danger" data-act="del">삭제</button>'
      + '</div>'
      + '<input class="mp-share" readonly value="' + esc(shareUrl(c.id)) + '" onclick="this.select()" '
      + 'style="width:100%;box-sizing:border-box;margin-top:12px;padding:8px 11px;border:1px solid var(--line);border-radius:8px;font-size:.82rem;font-family:ui-monospace,monospace;background:#f8fafc">'
      + '</div>';
  }

  var ac;
  async function render() {
    var cats = await API.myCatalogs();
    var head = '<div class="cx-head"><h1 class="cx-title">카달로그</h1>'
      + '<p class="cx-sub">만들고 편집한 뒤, 미리보기 링크를 공유하세요. <button class="btn-primary" id="newBtn" style="float:right">＋ 새 카달로그</button></p></div>';
    if (!cats.length) { ac.innerHTML = head + '<div class="cx-card" style="text-align:center;padding:44px"><div style="font-size:2.4rem;margin-bottom:8px">📖</div><p class="muted">아직 카달로그가 없습니다. <b>＋ 새 카달로그</b>로 시작하세요.</p></div>'; }
    else { ac.innerHTML = head + '<div class="cx-langs" style="position:static;display:flex;flex-direction:column;gap:16px">' + cats.map(card).join('') + '</div>'; }
    document.getElementById('newBtn').addEventListener('click', newCatalog);
  }

  async function newCatalog() {
    var t = prompt('새 카달로그 이름', '내 카달로그'); if (t == null) return;
    try { var c = await API.createCatalog(t.trim() || '내 카달로그'); location.href = 'editor.html?id=' + c.id; }
    catch (e) { alert('생성 실패: ' + (e.message || e)); }
  }

  async function showInq(id) {
    var body = document.getElementById('inqBody'); body.innerHTML = '<p class="muted">불러오는 중…</p>';
    document.getElementById('inqModal').style.display = 'flex';
    try {
      var rows = await API.myInquiries([id]);
      if (!rows.length) { body.innerHTML = '<p class="muted">접수된 문의가 없습니다.</p>'; return; }
      body.innerHTML = rows.map(function (r) {
        var c = []; if (r.phone) c.push('📞 ' + esc(r.phone)); if (r.email) c.push('✉️ ' + esc(r.email));
        return '<div style="border-top:1px solid var(--line);padding:10px 2px;font-size:.88rem"><b>' + esc(r.name || r.company || '(이름없음)') + '</b> '
          + '<span class="muted sm">' + esc((r.created_at || '').replace('T', ' ').slice(0, 16)) + '</span>'
          + (c.length ? '<div class="muted sm">' + c.join(' · ') + '</div>' : '')
          + (r.message ? '<div style="margin-top:4px;white-space:pre-wrap">' + esc(r.message) + '</div>' : '') + '</div>';
      }).join('');
    } catch (e) { body.innerHTML = '<p class="err">' + (e.message || e) + '</p>'; }
  }

  (async function () {
    var u = await API.requireUser();
    // 모달 보존(셸이 body를 덮어씀) → 셸 깐 뒤 모달 재부착
    var modal = document.getElementById('inqModal'); if (modal) modal.remove();
    ac = buildShell({ active: 'catalog', title: '카달로그', email: u.email });
    if (modal) document.body.appendChild(modal);
    ac.addEventListener('click', async function (ev) {
      var btn = ev.target.closest('[data-act]'); if (!btn) return;
      var cardEl = btn.closest('.cx-card'), id = cardEl.dataset.id, act = btn.dataset.act;
      try {
        if (act === 'share') { var inp = cardEl.querySelector('.mp-share'); inp.select(); document.execCommand('copy'); btn.textContent = '✓ 복사됨'; setTimeout(function () { btn.textContent = '🔗 링크복사'; }, 1500); }
        else if (act === 'del') { if (!confirm('이 카달로그를 삭제할까요? (되돌릴 수 없음)')) return; await API.deleteCatalog(id); render(); }
        else if (act === 'rename') { var t = prompt('카달로그 이름', cardEl.querySelector('.cx-card-title').textContent); if (t != null && t.trim()) { await API.updateCatalog(id, { title: t.trim() }); render(); } }
        else if (act === 'inq') { showInq(id); }
      } catch (e) { alert('오류: ' + (e.message || e)); }
    });
    render();
  })();
})();
