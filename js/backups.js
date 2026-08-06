/* 편집 백업 — 기존 backups.php 재현. 저장할 때마다 직전 상태가 자동 저장되고, 원하는 시점으로 되돌리기.
   데모는 카달로그가 여러 개라 상단에서 대상(언어 버전 포함)을 고른다. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(dt) { return (dt || '').replace('T', ' ').slice(0, 16); }
  var ac, cats = [], curId = null;

  function label(c) { return (c.parent_id ? '　└ ' : '') + (c.title || '카달로그') + ' · ' + API.langName(c.lang); }

  function picker() {
    if (cats.length <= 1) return '';
    return '<div class="bk-pick"><label class="muted sm">대상 카달로그 &nbsp;'
      + '<select id="bkSel">' + cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === curId ? ' selected' : '') + '>' + esc(label(c)) + '</option>'; }).join('') + '</select></label></div>';
  }

  async function renderList() {
    var host = document.getElementById('bkList');
    host.innerHTML = '<p class="muted">불러오는 중…</p>';
    try {
      var bks = await API.listBackups(curId);
      if (!bks.length) { host.innerHTML = '<div class="sub-empty"><div class="se-ico">🗂️</div><p class="muted">아직 백업이 없습니다. 편집 후 저장하면 자동으로 쌓입니다.</p></div>'; return; }
      host.innerHTML = '<ul class="sub-list">' + bks.map(function (b) {
        var restore = b.reason === 'restore';
        return '<li class="sub-item"><div class="sub-main"><div class="sub-top">'
          + '<span class="sub-name">' + esc(fmt(b.created_at)) + '</span>'
          + '<span class="sub-badge ' + (restore ? 'off' : 'ok') + '">' + (restore ? '복원 직전' : '저장 직전') + '</span>'
          + '<span class="muted sm">페이지 ' + (b.slide_count | 0) + '개</span></div></div>'
          + '<div class="sub-acts"><button class="btn-xs bk-restore" data-id="' + b.id + '" style="border-color:#93c5fd;color:#1d4ed8">되돌리기</button>'
          + '<button class="btn-xs danger bk-del" data-id="' + b.id + '">삭제</button></div></li>';
      }).join('') + '</ul>';
      host.querySelectorAll('.bk-restore').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!confirm('이 시점으로 되돌릴까요?\n현재 편집 내용은 백업된 뒤 교체됩니다.')) return;
          btn.disabled = true; btn.textContent = '되돌리는 중…';
          try { await API.restoreBackup(btn.dataset.id, curId); alert('선택한 백업으로 되돌렸습니다. (되돌리기 직전 상태도 백업됨)'); renderList(); }
          catch (e) { alert('오류: ' + (e.message || e)); btn.disabled = false; btn.textContent = '되돌리기'; }
        });
      });
      host.querySelectorAll('.bk-del').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          if (!confirm('이 백업을 삭제할까요?')) return;
          btn.disabled = true;
          try { await API.deleteBackup(btn.dataset.id); renderList(); }
          catch (e) { alert('오류: ' + (e.message || e)); btn.disabled = false; }
        });
      });
    } catch (e) { host.innerHTML = '<p class="err">' + (e.message || e) + '</p>'; }
  }

  function render() {
    ac.innerHTML = '<section class="card"><div class="sub-head"><div>'
      + '<h2 class="sub-h2">편집 백업 <span class="muted">(최근 30개 자동 보관)</span></h2>'
      + '<p class="muted sm">저장할 때마다 <b>직전 상태</b>가 자동 백업됩니다. 문제가 생기면 원하는 시점으로 되돌리세요.</p></div></div>'
      + picker() + '<div id="bkList"></div></section>';
    var sel = document.getElementById('bkSel');
    if (sel) sel.addEventListener('change', function () { curId = sel.value; renderList(); });
    renderList();
  }

  (async function () {
    var u = await API.requireUser();
    ac = buildShell({ active: 'backups', title: '편집 백업', email: u.email });
    ac.innerHTML = '<div class="card"><p class="muted">불러오는 중…</p></div>';
    try {
      cats = await API.allMyCatalogs();
      if (!cats.length) { ac.innerHTML = '<section class="card"><div class="sub-empty"><div class="se-ico">🗂️</div><p class="muted">카달로그가 없습니다. 먼저 카달로그를 만들어 주세요.</p></div></section>'; return; }
      curId = cats[0].id;
      render();
    } catch (e) { ac.innerHTML = '<div class="card"><p class="err">' + (e.message || e) + '</p></div>'; }
  })();
})();
