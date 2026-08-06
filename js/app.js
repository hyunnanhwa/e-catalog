/* 마이페이지 로직 — 카달로그 목록/생성/설정/삭제 + 문의내역. 게시 버튼 없음(요청). */
(function () {
  var listEl = document.getElementById('list');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ytId(s) { s = (s || '').trim(); var m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/); if (m) return m[1]; return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : ''; }
  function shareUrl(id) { return location.href.replace(/app\.html.*$/, '') + 'view.html?id=' + id; }

  function card(c) {
    var aspects = ['16:9', '4:3', '3:2', '1:1', '21:9', '3:4', '9:16'];
    var opts = aspects.map(function (a) { return '<option value="' + a + '"' + (c.aspect === a ? ' selected' : '') + '>' + a + '</option>'; }).join('');
    return '<div class="cx-card" data-id="' + c.id + '">'
      + '<div class="cx-card-head"><span class="cx-flag">📖</span><div class="cx-card-info">'
      + '<div class="cx-card-title">' + esc(c.title) + '</div>'
      + '<div class="cx-card-meta"><span class="cx-status published">내 카달로그</span></div></div></div>'
      + '<div class="cx-actions">'
      + '<a class="cx-btn primary" href="editor.html?id=' + c.id + '">🎨 편집</a>'
      + '<a class="cx-btn" href="view.html?id=' + c.id + '" target="_blank">👁 미리보기</a>'
      + '<button class="cx-btn" data-act="share">🔗 링크복사</button>'
      + '<button class="cx-btn" data-act="inq">✉️ 문의내역</button>'
      + '<button class="cx-btn" data-act="rename">✏️ 이름</button>'
      + '<button class="cx-btn danger" data-act="del">삭제</button>'
      + '</div>'
      + '<div class="cx-set">'
      + '<label class="muted sm">비율</label><select data-f="aspect">' + opts + '</select>'
      + '<input class="bgm" data-f="bgm" placeholder="배경음악 유튜브 링크(선택)" value="' + esc(c.bgm_youtube || '') + '">'
      + '<label class="muted sm"><input type="checkbox" data-f="auto"' + (c.bgm_autoplay ? ' checked' : '') + '> 자동재생</label>'
      + '<button class="cx-btn" data-act="save">설정 저장</button>'
      + '</div>'
      + '<input class="mp-share" readonly value="' + esc(shareUrl(c.id)) + '" onclick="this.select()">'
      + '</div>';
  }

  async function render() {
    var cats = await API.myCatalogs();
    if (!cats.length) { listEl.innerHTML = '<div class="cx-card" style="text-align:center;padding:40px"><p class="muted">아직 카달로그가 없습니다. 위 <b>＋ 새 카달로그</b>로 시작하세요.</p></div>'; return; }
    listEl.innerHTML = cats.map(card).join('');
    listEl.style.display = 'flex'; listEl.style.flexDirection = 'column'; listEl.style.gap = '16px'; listEl.style.position = 'static';
  }

  listEl.addEventListener('click', async function (ev) {
    var btn = ev.target.closest('[data-act]'); if (!btn) return;
    var cardEl = btn.closest('.cx-card'), id = cardEl.dataset.id, act = btn.dataset.act;
    try {
      if (act === 'share') { var inp = cardEl.querySelector('.mp-share'); inp.select(); document.execCommand('copy'); btn.textContent = '✓ 복사됨'; setTimeout(function () { btn.textContent = '🔗 링크복사'; }, 1500); }
      else if (act === 'del') { if (!confirm('이 카달로그를 삭제할까요? (되돌릴 수 없음)')) return; await API.deleteCatalog(id); render(); }
      else if (act === 'rename') { var t = prompt('카달로그 이름', cardEl.querySelector('.cx-card-title').textContent); if (t != null && t.trim()) { await API.updateCatalog(id, { title: t.trim() }); render(); } }
      else if (act === 'save') {
        var aspect = cardEl.querySelector('[data-f=aspect]').value;
        var bgm = ytId(cardEl.querySelector('[data-f=bgm]').value) || null;
        var auto = cardEl.querySelector('[data-f=auto]').checked;
        await API.updateCatalog(id, { aspect: aspect, bgm_youtube: bgm, bgm_autoplay: auto });
        btn.textContent = '✓ 저장됨'; setTimeout(function () { btn.textContent = '설정 저장'; }, 1500);
      }
      else if (act === 'inq') { showInq(id); }
    } catch (e) { alert('오류: ' + (e.message || e)); }
  });

  async function showInq(id) {
    var body = document.getElementById('inqBody'); body.innerHTML = '<p class="muted">불러오는 중…</p>';
    document.getElementById('inqModal').style.display = 'flex';
    try {
      var rows = await API.myInquiries([id]);
      if (!rows.length) { body.innerHTML = '<p class="muted">접수된 문의가 없습니다.</p>'; return; }
      body.innerHTML = rows.map(function (r) {
        var c = []; if (r.phone) c.push('📞 ' + esc(r.phone)); if (r.email) c.push('✉️ ' + esc(r.email));
        return '<div class="inq"><b>' + esc(r.name || r.company || '(이름없음)') + '</b> '
          + '<span class="muted sm">' + esc((r.created_at || '').replace('T', ' ').slice(0, 16)) + '</span>'
          + (c.length ? '<div class="muted sm">' + c.join(' · ') + '</div>' : '')
          + (r.message ? '<div style="margin-top:4px;white-space:pre-wrap">' + esc(r.message) + '</div>' : '') + '</div>';
      }).join('');
    } catch (e) { body.innerHTML = '<p class="err">' + (e.message || e) + '</p>'; }
  }

  document.getElementById('newBtn').addEventListener('click', async function () {
    var t = prompt('새 카달로그 이름', '내 카달로그'); if (t == null) return;
    try { var c = await API.createCatalog(t.trim() || '내 카달로그'); location.href = 'editor.html?id=' + c.id; }
    catch (e) { alert('생성 실패: ' + (e.message || e)); }
  });
  document.getElementById('logout').addEventListener('click', async function (e) { e.preventDefault(); await API.signOut(); location.href = 'index.html'; });

  (async function () {
    var u = await API.requireUser();
    document.getElementById('meEmail').textContent = u.email;
    render();
  })();
})();
