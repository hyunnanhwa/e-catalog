/* 미디어 — 기존 media.php 재현. Supabase Storage에 올라간 내 이미지/영상 목록·URL복사·삭제. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function human(n) { if (!n) return ''; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(0) + ' KB'; return (n / 1048576).toFixed(1) + ' MB'; }
  function isVid(name) { return /\.(mp4|webm|mov|ogg)$/i.test(name); }
  var BIG_IMG = 1.5 * 1024 * 1024, BIG_VID = 12 * 1024 * 1024;
  function isBig(m) { return m.size > (isVid(m.name) ? BIG_VID : BIG_IMG); }
  var PER = 20;
  var ac, items = [], page = 1;

  function render() {
    var pages = Math.max(1, Math.ceil(items.length / PER));
    if (page > pages) page = pages;
    var pageItems = items.slice((page - 1) * PER, page * PER);
    var bigCount = items.filter(isBig).length;
    var notice = bigCount ? '<div class="notice warn" style="margin-bottom:16px"><b>⚠️ 용량이 큰 파일 ' + bigCount + '개</b> — 썸네일 좌측 상단 <b>빨간 !</b> 표시. <a href="tools.html" style="color:var(--accent)">이미지 도구</a>로 줄이면 카달로그가 더 빨리 열려요.</div>' : '';
    var body;
    if (!items.length) body = '<div class="card"><div class="empty">업로드된 미디어가 없어요. 에디터에서 이미지·영상을 올리면 여기에 모입니다.</div></div>';
    else body = '<div class="media">' + pageItems.map(function (m) {
      var big = isBig(m), vid = isVid(m.name);
      var warn = big ? '<span class="warn" title="용량이 큽니다 (' + human(m.size) + '). 이미지 도구에서 줄인 뒤 다시 올리면 로딩이 빨라져요.">!</span>' : '';
      var im = vid
        ? '<div class="im">' + warn + '<video src="' + esc(m.url) + '" muted preload="metadata"></video><span class="kind">영상</span></div>'
        : '<div class="im" style="background-image:url(' + esc(m.url) + ')">' + warn + '<span class="kind">이미지</span></div>';
      return '<div class="mi' + (big ? ' big' : '') + '" data-path="' + esc(m.path) + '">' + im
        + '<div class="cap"><div>' + human(m.size) + (big ? ' · 큼' : '') + '</div></div>'
        + '<div style="display:flex;gap:6px;padding:0 10px 10px"><button class="btn sm copy" data-url="' + esc(m.url) + '" style="flex:1">URL</button>'
        + '<button class="btn sm dan md-del">삭제</button></div></div>';
    }).join('') + '</div>';

    var pager = '';
    if (pages > 1) {
      var btns = '';
      btns += page > 1 ? '<a data-pg="' + (page - 1) + '">‹</a>' : '<span class="dis">‹</span>';
      for (var i = 1; i <= pages; i++) btns += (i === page ? '<span class="on">' + i + '</span>' : '<a data-pg="' + i + '">' + i + '</a>');
      btns += page < pages ? '<a data-pg="' + (page + 1) + '">›</a>' : '<span class="dis">›</span>';
      pager = '<div class="pager"><div></div><div class="pg">' + btns + '</div></div>';
    }
    ac.innerHTML = '<div class="head"><div><h1 class="h1">미디어 라이브러리</h1><p class="sub">Storage에 올라간 이미지·영상입니다. 업로드는 <b>에디터</b>에서 진행됩니다.</p></div>'
      + '<div class="sp"></div><span class="muted">' + items.length + '개' + (pages > 1 ? ' · ' + page + '/' + pages + 'p' : '') + '</span></div>'
      + notice + body + pager;

    ac.querySelectorAll('.pager a[data-pg]').forEach(function (a) {
      a.addEventListener('click', function () { page = +a.dataset.pg; render(); window.scrollTo(0, 0); });
    });
    ac.querySelectorAll('.copy').forEach(function (b) {
      b.addEventListener('click', function () { navigator.clipboard.writeText(b.dataset.url); var t = b.textContent; b.textContent = '복사됨'; setTimeout(function () { b.textContent = t; }, 1200); });
    });
    ac.querySelectorAll('.md-del').forEach(function (b) {
      b.addEventListener('click', async function () {
        var cell = b.closest('.mi'); if (!confirm('이 파일을 삭제할까요? (카달로그에서 사용 중이면 이미지가 깨질 수 있습니다)')) return;
        b.disabled = true;
        try { await API.deleteMedia(cell.dataset.path); items = items.filter(function (m) { return m.path !== cell.dataset.path; }); render(); }
        catch (e) { alert('삭제 실패: ' + (e.message || e)); b.disabled = false; }
      });
    });
  }
  (async function () {
    var u = await API.requireUser();
    ac = buildShell({ active: 'media', title: '미디어', email: u.email });
    ac.innerHTML = '<div class="card"><p class="muted">불러오는 중…</p></div>';
    try { items = await API.listMedia(); render(); }
    catch (e) { ac.innerHTML = '<div class="card"><p class="err">' + (e.message || e) + '</p></div>'; }
  })();
})();
