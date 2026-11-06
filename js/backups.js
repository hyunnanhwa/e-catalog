/* 편집 백업 — 기존 backups.php 재현. 저장할 때마다 직전 상태가 자동 저장되고, 원하는 시점으로 되돌리기.
   데모는 카달로그가 여러 개라 상단에서 대상(언어 버전 포함)을 고른다. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(dt) { return (dt || '').replace('T', ' ').slice(0, 16); }
  var ac, cats = [], curId = null;

  function label(c) { return (c.parent_id ? '　└ ' : '') + (c.title || '카달로그') + ' · ' + API.langName(c.lang); }

  function picker() {
    if (cats.length <= 1) return '';
    return '<div class="toolbar"><label class="muted" style="display:flex;align-items:center;gap:8px">대상 카달로그'
      + '<select class="sel" id="bkSel" style="width:auto">' + cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === curId ? ' selected' : '') + '>' + esc(label(c)) + '</option>'; }).join('') + '</select></label></div>';
  }

  async function renderList() {
    var host = document.getElementById('bkList');
    host.innerHTML = '<div class="empty">불러오는 중…</div>';
    try {
      var bks = await API.listBackups(curId);
      if (!bks.length) { host.innerHTML = '<div class="empty">아직 백업이 없어요. 편집 후 저장하면 자동으로 쌓입니다.</div>'; return; }
      host.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>구분</th><th>시각</th><th class="num">페이지</th><th style="width:1%"></th></tr></thead><tbody>'
        + bks.map(function (b, i) {
          var restore = b.reason === 'restore';
          return '<tr><td><span class="badge b-' + (restore ? 'read' : 'done') + '">' + (restore ? '복원 직전' : '저장 직전') + '</span></td>'
            + '<td class="title">' + esc(fmt(b.created_at)) + (i === 0 ? ' <span class="faint" style="font-weight:400">· 최신</span>' : '') + '</td>'
            + '<td class="num">' + (b.slide_count | 0) + '</td>'
            + '<td class="num"><div style="display:flex;gap:6px;justify-content:flex-end">'
            + '<button class="btn sm bk-restore" data-id="' + b.id + '">되돌리기</button>'
            + '<button class="btn sm dan bk-del" data-id="' + b.id + '">삭제</button></div></td></tr>';
        }).join('') + '</tbody></table></div>';
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
    ac.innerHTML = '<div class="head"><div><h1 class="h1">편집 백업</h1>'
      + '<p class="sub">저장할 때마다 <b>직전 상태</b>가 자동 백업돼요(최근 10개). 잘못 고쳤을 때 원하는 시점으로 되돌리세요.</p></div></div>'
      + '<div class="card"><div class="card-h">백업 목록 <span class="note">최근 10개 자동 보관</span></div>'
      + picker() + '<div id="bkList"></div></div>';
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
      if (!cats.length) { ac.innerHTML = '<div class="head"><div><h1 class="h1">편집 백업</h1></div></div><div class="card"><div class="empty">카달로그가 없어요. 먼저 카달로그를 만들어 주세요.</div></div>'; return; }
      curId = cats[0].id;
      render();
    } catch (e) { ac.innerHTML = '<div class="card"><p class="err">' + (e.message || e) + '</p></div>'; }
  })();
})();
