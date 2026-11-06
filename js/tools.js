/* 이미지 도구 — 기존 tools.php 재현. Re-On Dev(liondev.kr) 무료 이미지 도구 링크. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var TOOLS = [
    ['🗜️', '이미지 용량 조절', '사진 용량을 줄여 업로드 제한에 맞게 압축', 'https://liondev.kr/compress'],
    ['✨', 'AI 업스케일링', '작고 흐린 이미지를 선명하게 확대', 'https://upscale.liondev.kr'],
    ['🪄', 'AI 배경 제거', '제품 사진 배경을 자동으로 깔끔하게 제거', 'https://bg.liondev.kr'],
    ['🎞️', 'GIF 변환', '영상을 움직이는 GIF(움짤)로 변환', 'https://v2g.liondev.kr']
  ];
  (async function () {
    var u = await API.requireUser();
    var ac = buildShell({ active: 'tools', title: '이미지 도구', email: u.email });
    var cards = TOOLS.map(function (t) {
      return '<a class="board" href="' + t[3] + '" target="_blank" rel="noopener">'
        + '<div class="bt"><div class="ic" style="font-size:20px">' + t[0] + '</div><div style="min-width:0"><div class="n">' + esc(t[1]) + '</div></div></div>'
        + '<div class="meta" style="display:block;line-height:1.5">' + esc(t[2]) + '</div>'
        + '<div class="act"><span class="btn sm">열기 ↗</span></div></a>';
    }).join('');
    ac.innerHTML = '<div class="head"><div><h1 class="h1">이미지 도구</h1><p class="sub">이미지·영상·움짤은 <b>용량 제한</b>이 있어요. 파일이 크면 아래 무료 도구로 <b>용량을 줄이거나 변환</b>한 뒤 업로드하세요.</p></div>'
      + '<div class="sp"></div><span class="badge b-info plain">Re-On Dev 제공</span></div>'
      + '<div class="boards">' + cards + '</div>'
      + '<p class="sub" style="margin-top:16px">더 많은 도구 → <a href="https://liondev.kr" target="_blank" rel="noopener" style="color:var(--accent);font-weight:500">liondev.kr</a></p>';
  })();
})();
