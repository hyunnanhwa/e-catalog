/* 배경음악 페이지 — 기존 bgm.php UI(좌 미리보기 iframe + 우 음원목록/직접입력/미리듣기/자동재생) 재현. */
(function () {
  var TRACKS = [
    ['JmQEkWAUG7k', '감성 어쿠스틱'], ['pWAP7fIwGnI', '잔잔한 힐링'], ['siCmqvfw_1g', '밝고 경쾌'],
    ['1v9txCf3R8U', '세련된 로파이'], ['qxUOF_dqQOY', '시네마틱'], ['I34bTKW8ud0', '차분한 기업']
  ];
  var listIds = TRACKS.map(function (t) { return t[0]; });
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ytId(s) { s = (s || '').trim(); var m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/); if (m) return m[1]; return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : ''; }

  var ac, cats, cat;

  function render() {
    var cur = cat.bgm_youtube || '', inList = listIds.indexOf(cur) >= 0, curCustom = (cur && !inList) ? cur : '';
    var curValid = inList ? cur : (curCustom || '');
    var picker = cats.length > 1
      ? '<label class="muted" style="display:flex;align-items:center;gap:8px">카달로그 <select id="bgmCat" class="sel" style="width:auto">' + cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cat.id ? ' selected' : '') + '>' + esc(c.title) + '</option>'; }).join('') + '</select></label>'
      : '';
    var tracks = '<label class="check"><input type="radio" name="bgm_id" value="" data-yt="" ' + (cur === '' ? 'checked' : '') + '> 배경음악 없음</label>'
      + TRACKS.map(function (t) { return '<label class="check"><input type="radio" name="bgm_id" value="' + t[0] + '" data-yt="' + t[0] + '" ' + (cur === t[0] ? 'checked' : '') + '> ' + esc(t[1]) + '</label>'; }).join('')
      + '<label class="check" style="border-top:1px solid var(--line);margin-top:6px;padding-top:12px"><input type="radio" name="bgm_id" id="bgmCustomRadio" value="__custom__" ' + (curCustom ? 'checked' : '') + '> 직접 입력 (유튜브 링크)</label>'
      + '<input type="text" id="bgmCustomUrl" class="inp" style="margin:6px 0 10px" placeholder="https://www.youtube.com/watch?v=..." value="' + (curCustom ? 'https://youtu.be/' + esc(curCustom) : '') + '">';

    ac.innerHTML = '<div class="head"><div><h1 class="h1">배경음악</h1><p class="sub">빠른 선택 음원에서 고르거나, 원하는 유튜브 링크를 직접 붙여넣으세요.</p></div><div class="sp"></div>' + picker + '<a class="btn sm" href="app.html">← 카달로그</a></div>'
      + '<div class="grid2">'
      + '<div class="card"><div class="card-h">미리보기</div><div class="card-b"><div style="aspect-ratio:16/9;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--panel2)"><iframe id="bgmPrevCat" src="view.html?id=' + cat.id + '&_=' + Date.now() + '" title="미리보기" loading="lazy" style="width:100%;height:100%;border:0;display:block"></iframe></div></div></div>'
      + '<div class="card"><div class="card-h">🎵 배경음악</div>'
      + '<form class="card-b" id="bgmForm">' + tracks
      + '<div id="bgmPrev" style="' + (curValid ? '' : 'display:none') + ';margin-bottom:12px"><div class="hint" style="margin-bottom:4px">미리듣기</div>'
      + '<iframe id="bgmPrevFrame" width="100%" height="160" src="' + (curValid ? 'https://www.youtube.com/embed/' + esc(curValid) : '') + '" title="미리듣기" frameborder="0" allow="autoplay; encrypted-media" style="border-radius:8px;border:1px solid var(--line)"></iframe></div>'
      + '<label class="check" style="margin:4px 0 14px"><input type="checkbox" id="bgmAuto" ' + (cat.bgm_autoplay ? 'checked' : '') + '> 카달로그 열릴 때 자동 재생</label>'
      + '<button type="submit" class="btn pri" style="width:100%">저장</button></form></div></div>';

    if (cats.length > 1) document.getElementById('bgmCat').addEventListener('change', function (e) { location.href = 'bgm.html?id=' + e.target.value; });

    var box = document.getElementById('bgmPrev'), fr = document.getElementById('bgmPrevFrame');
    var cu = document.getElementById('bgmCustomUrl'), cr = document.getElementById('bgmCustomRadio');
    function preview(id) { if (id) { box.style.display = 'block'; fr.src = 'https://www.youtube.com/embed/' + id; } else { box.style.display = 'none'; fr.src = ''; } }
    document.querySelectorAll('input[name="bgm_id"]').forEach(function (r) { r.addEventListener('change', function () { preview(r.value === '__custom__' ? ytId(cu.value) : (r.dataset.yt || '')); }); });
    cu.addEventListener('input', function () { cr.checked = true; preview(ytId(cu.value)); });

    document.getElementById('bgmForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var sel = document.querySelector('input[name="bgm_id"]:checked');
      var raw = (sel && sel.value === '__custom__') ? cu.value : (sel ? sel.value : '');
      var yt = ytId(raw) || null;
      var auto = document.getElementById('bgmAuto').checked;
      try {
        await API.updateCatalog(cat.id, { bgm_youtube: yt, bgm_autoplay: auto });
        cat.bgm_youtube = yt; cat.bgm_autoplay = auto;
        var pv = document.getElementById('bgmPrevCat'); if (pv) pv.src = 'view.html?id=' + cat.id + '&_=' + Date.now();   // 미리보기 최신화
        e.submitter && (e.submitter.textContent = '✓ 저장됨'); setTimeout(function () { var b = document.querySelector('#bgmForm button[type=submit]'); if (b) b.textContent = '저장'; }, 1500);
      } catch (ex) { alert('저장 실패: ' + (ex.message || ex)); }
    });
  }

  (async function () {
    var u = await API.requireUser();
    cats = await API.myCatalogs();
    ac = buildShell({ active: 'catalog', title: '배경음악', email: u.email });
    if (!cats.length) { ac.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p class="muted">먼저 <a href="app.html">카달로그</a>를 만들어 주세요.</p></div>'; return; }
    var id = new URLSearchParams(location.search).get('id');
    cat = cats.filter(function (c) { return c.id === id; })[0] || cats[0];
    render();
  })();
})();
