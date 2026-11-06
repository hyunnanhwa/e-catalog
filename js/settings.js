/* 환경설정 — 기존 settings.php 재현. 포인트 컬러(미리보기 네비/페이지번호/재생버튼 배경) 통일. */
(function () {
  var ac, cur = '#1a1a1a';
  function render(msg) {
    ac.innerHTML = '<div class="head"><div><h1 class="h1">환경설정</h1><p class="sub">미리보기·카달로그의 포인트 컬러를 설정합니다.</p></div></div>'
      + (msg ? '<div class="flash-box" style="margin-bottom:16px">' + msg + '</div>' : '')
      + '<div class="card" style="max-width:520px"><div class="card-h">포인트 컬러</div><div class="card-b">'
      + '<div class="field"><label>포인트 컬러</label>'
      + '<input type="color" id="pc" value="' + cur + '" style="width:64px;height:40px;padding:2px;border:1px solid var(--line2);border-radius:8px;background:var(--panel)">'
      + '<p class="hint">미리보기·카달로그의 <b>네비게이션 버튼 · 페이지 번호 · 재생 버튼</b> 배경색이 이 색으로 통일됩니다. (내 모든 카달로그에 적용)</p></div>'
      + '</div><div class="card-f"><button class="btn pri" id="save">저장</button></div></div>';
    document.getElementById('save').addEventListener('click', save);
  }
  async function save() {
    var btn = document.getElementById('save'); btn.disabled = true; btn.textContent = '저장 중…';
    try { cur = document.getElementById('pc').value; var n = await API.setPointColor(cur); render('저장되었습니다. (카달로그 ' + n + '개 적용)'); }
    catch (e) { render('오류: ' + (e.message || e)); }
  }
  (async function () {
    var u = await API.requireUser();
    ac = buildShell({ active: 'settings', title: '환경설정', email: u.email });
    ac.innerHTML = '<div class="card"><p class="muted">불러오는 중…</p></div>';
    try { cur = await API.getPointColor(); render(''); }
    catch (e) { ac.innerHTML = '<div class="card"><p class="err">' + (e.message || e) + '</p></div>'; }
  })();
})();
