/* 카달로그 대시보드 — 기존 catalogs.php 구조 그대로: 그룹(원본+언어사본) · 국기 버전카드 · 🌐 언어 추가.
   게시 버튼 없음. 데모는 카달로그를 여러 개 만들 수 있어 그룹을 여러 개 나열한다. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shareUrl(id) { return location.href.replace(/app\.html.*$/, '') + 'view.html?id=' + id; }
  function flagImg(lang, cls) {
    var cc = API.langCc(lang);
    return cc ? '<img class="' + cls + '" src="https://flagcdn.com/w40/' + cc + '.png" srcset="https://flagcdn.com/w80/' + cc + '.png 2x" alt="' + esc(API.langName(lang)) + '" style="width:26px;height:auto;border-radius:3px">'
      : '<span class="' + cls + '">' + API.langFlag(lang) + '</span>';
  }

  // 버전(언어별) 카드
  function versionCard(v, isBase) {
    return '<div class="cx-card" data-id="' + v.id + '" data-lang="' + esc(v.lang) + '">'
      + '<div class="cx-card-head"><span class="cx-flag">' + flagImg(v.lang, 'cx-flag-img') + '</span>'
      + '<div class="cx-card-info"><div class="cx-card-title">' + esc(API.langName(v.lang)) + (isBase ? ' <span class="cx-tag">원본</span>' : '') + '</div>'
      + '<div class="cx-card-meta"><span>' + esc(v.title || '') + '</span></div></div></div>'
      + '<div class="cx-actions">'
      + '<a class="cx-btn primary" href="editor.html?id=' + v.id + '">🎨 편집</a>'
      + '<a class="cx-btn" href="bgm.html?id=' + v.id + '">🎵 배경음악</a>'
      + '<a class="cx-btn" href="view.html?id=' + v.id + '" target="_blank">👁 미리보기</a>'
      + '<button class="cx-btn" data-act="share">🔗 링크복사</button>'
      + '<button class="cx-btn" data-act="inq">✉️ 문의내역</button>'
      + '<button class="cx-btn danger" data-act="del">' + (isBase ? '그룹 삭제' : '삭제') + '</button>'
      + '</div>'
      + '<input class="mp-share" readonly value="' + esc(shareUrl(v.id)) + '" onclick="this.select()"'
      + ' style="width:100%;box-sizing:border-box;margin-top:12px;padding:8px 11px;border:1px solid var(--line);border-radius:8px;font-size:.82rem;font-family:ui-monospace,monospace;background:#f8fafc">'
      + '</div>';
  }

  // 그룹(원본 1개 + 언어 사본들)
  function group(base, versions) {
    var have = versions.map(function (v) { return v.lang; });
    var addable = Object.keys(API.LANGS).filter(function (c) { return have.indexOf(c) < 0; });
    var cards = versions.map(function (v) { return versionCard(v, !v.parent_id); }).join('');
    var addForm = addable.length
      ? '<form class="cx-add" data-root="' + base.id + '"><span class="cx-add-label">🌐 언어 추가</span>'
        + '<select class="cx-add-sel">' + addable.map(function (c) { return '<option value="' + c + '">' + API.langFlag(c) + ' ' + esc(API.langName(c)) + '</option>'; }).join('') + '</select>'
        + '<button class="cx-btn primary" type="submit">＋ 원본 복제해서 만들기</button></form>'
      : '<p class="cx-alldone">✓ 모든 지원 언어가 추가되어 있습니다.</p>';
    return '<div class="cx-group" data-root="' + base.id + '">'
      + '<div class="cx-head"><h1 class="cx-title">' + esc(base.title) + '</h1>'
      + '<p class="cx-sub">언어 버전을 만들고 안의 <b>글자만 바꾸면</b> 됩니다. 뷰어에는 국기로 언어 전환이 표시됩니다. '
      + '<button class="cx-btn" data-act="rename" data-id="' + base.id + '">✏️ 이름</button></p></div>'
      + '<div class="cx-langs" style="position:static">' + cards + '</div>'
      + addForm + '</div>';
  }

  var ac;
  async function render() {
    var all = await API.allMyCatalogs();
    var bases = all.filter(function (c) { return !c.parent_id; });
    var head = '<div class="cx-topbar"><h1 class="cx-title" style="margin:0">카달로그</h1>'
      + '<button class="btn-primary" id="newBtn">＋ 새 카달로그</button></div>';
    if (!bases.length) {
      ac.innerHTML = head + '<div class="cx-card" style="text-align:center;padding:44px"><div style="font-size:2.4rem;margin-bottom:8px">📖</div><p class="muted">아직 카달로그가 없습니다. <b>＋ 새 카달로그</b>로 시작하세요.</p></div>';
    } else {
      var groups = bases.map(function (b) {
        var versions = all.filter(function (c) { return c.id === b.id || c.parent_id === b.id; })
          .sort(function (a, z) { if (!a.parent_id) return -1; if (!z.parent_id) return 1; return (a.created_at || '') < (z.created_at || '') ? -1 : 1; });
        return group(b, versions);
      }).join('<hr class="cx-div">');
      ac.innerHTML = head + '<div class="cx-groups">' + groups + '</div>';
    }
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
    var modal = document.getElementById('inqModal'); if (modal) modal.remove();
    ac = buildShell({ active: 'catalog', title: '카달로그', email: u.email });
    if (modal) document.body.appendChild(modal);

    // 언어 추가 폼 제출
    ac.addEventListener('submit', async function (ev) {
      var f = ev.target.closest('.cx-add'); if (!f) return;
      ev.preventDefault();
      var root = f.dataset.root, lang = f.querySelector('.cx-add-sel').value;
      var btn = f.querySelector('button'); btn.disabled = true; btn.textContent = '복제 중…';
      try { await API.addLanguage(root, lang); render(); }
      catch (e) { alert(e.message || e); btn.disabled = false; btn.textContent = '＋ 원본 복제해서 만들기'; }
    });

    // 버튼 액션
    ac.addEventListener('click', async function (ev) {
      var btn = ev.target.closest('[data-act]'); if (!btn) return;
      var act = btn.dataset.act;
      try {
        if (act === 'rename') {
          var gid = btn.dataset.id, cur = btn.closest('.cx-group').querySelector('.cx-title').textContent.trim();
          var t = prompt('카달로그(그룹) 이름', cur);
          if (t != null && t.trim()) { await API.updateCatalog(gid, { title: t.trim() }); render(); }
          return;
        }
        var cardEl = btn.closest('.cx-card'); if (!cardEl) return;
        var id = cardEl.dataset.id, isBase = !cardEl.querySelector('.cx-tag') ? false : true;
        if (act === 'share') { var inp = cardEl.querySelector('.mp-share'); inp.select(); document.execCommand('copy'); var o = btn.textContent; btn.textContent = '✓ 복사됨'; setTimeout(function () { btn.textContent = o; }, 1500); }
        else if (act === 'inq') { showInq(id); }
        else if (act === 'del') {
          var msg = isBase ? '원본과 모든 언어 버전을 삭제합니다. 계속할까요? (되돌릴 수 없음)' : '이 언어 버전을 삭제할까요?';
          if (!confirm(msg)) return;
          await API.deleteCatalog(id);   // 원본 삭제 시 사본은 ON DELETE CASCADE로 함께 삭제
          render();
        }
      } catch (e) { alert('오류: ' + (e.message || e)); }
    });
    render();
  })();
})();
