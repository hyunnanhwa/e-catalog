/* AI 채팅 대화 기록 — 열람 전용(관리자는 대화에 참여하지 않음). 정리용 삭제만 가능. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(dt, sec) { if (!dt) return '-'; var d = new Date(dt); function p(n) { return ('0' + n).slice(-2); } return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + (sec ? ':' + p(d.getSeconds()) : ''); }
  function maskIp(ip) { var p = String(ip || '').split('.'); return p.length === 4 ? p[0] + '.' + p[1] + '.*.*' : (ip ? String(ip).slice(0, 9) + '…' : '-'); }
  var ac, sessions = [], titleById = {}, openId = null;

  async function render() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var nToday = sessions.filter(function (s) { return new Date(s.created_at) >= today; }).length;
    var nQ = sessions.reduce(function (a, s) { return a + (s.msg_count || 0); }, 0);
    var head = '<div class="head"><div><h1 class="h1">AI 채팅</h1><p class="sub">카달로그의 AI 채팅에서 나눈 대화입니다. 확인용으로만 볼 수 있습니다.</p></div></div>'
      + '<div class="stats"><div class="stat card"><div class="l">전체 대화</div><div class="v">' + sessions.length + '</div></div>'
      + '<div class="stat card"><div class="l">오늘 대화</div><div class="v">' + nToday + '</div></div>'
      + '<div class="stat card"><div class="l">받은 질문</div><div class="v">' + nQ + '</div></div></div>';
    if (API.__demo) { ac.innerHTML = head + '<div class="card"><div class="empty">데모 모드에서는 AI 답변과 대화 기록이 동작하지 않습니다. Supabase와 AI 설정을 마치면 여기에 쌓입니다.</div></div>'; return; }
    if (!sessions.length) { ac.innerHTML = head + '<div class="card"><div class="empty">아직 나눈 대화가 없어요. 카달로그에 AI 채팅을 넣으면 여기에 쌓입니다.</div></div>'; return; }
    if (!openId) openId = sessions[0].id;
    var cur = sessions.filter(function (s) { return s.id === openId; })[0];
    var msgs = cur ? await API.chatMessages(cur.id) : [];
    var list = sessions.map(function (s) {
      return '<a href="#" data-s="' + esc(s.id) + '" class="' + (s.id === openId ? 'on' : '') + '"><div class="q">' + esc(s.first_q || '(질문 없음)') + '</div>'
        + '<div class="meta"><span>' + esc(fmt(s.updated_at)) + '</span><span>질문 ' + (s.msg_count || 0) + '개</span><span>' + esc(titleById[s.catalog_id] || '') + '</span></div></a>';
    }).join('');
    var log = cur ? ('<div class="card-h">대화 내용 <span class="note">' + esc(fmt(cur.created_at, true)) + ' 시작 · ' + esc(maskIp(cur.ip)) + '</span>'
      + '<button class="btn sm dan" id="chDel" style="margin-left:auto">삭제</button></div><div class="chl-log">'
      + msgs.map(function (m) { var u = m.role === 'user'; return '<div class="m ' + (u ? 'user' : 'ai') + '"><div class="b">' + esc(m.content) + '</div><div class="t">' + (u ? '방문자' : 'AI') + ' · ' + esc(fmt(m.created_at, true)) + '</div></div>'; }).join('')
      + '</div>') : '';
    ac.innerHTML = head + '<div class="chl"><div class="card chl-list">' + list + '</div><div class="card">' + log + '</div></div>';
    ac.querySelectorAll('[data-s]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openId = a.dataset.s; render(); }); });
    var del = document.getElementById('chDel');
    if (del) del.addEventListener('click', async function () { if (!confirm('이 대화를 삭제할까요?')) return; await API.deleteChat(openId); sessions = sessions.filter(function (s) { return s.id !== openId; }); openId = null; render(); });
  }

  (async function () {
    var u = await API.requireUser();
    ac = buildShell({ active: 'chats', title: 'AI 채팅', email: u.email });
    ac.innerHTML = '<div class="card"><p class="muted">불러오는 중…</p></div>';
    try {
      var cats = await API.allMyCatalogs();
      cats.forEach(function (c) { titleById[c.id] = c.title + (c.parent_id ? ' (' + String(c.lang || '').toUpperCase() + ')' : ''); });
      sessions = await API.listChats(cats.map(function (c) { return c.id; }));
      await render();
    } catch (e) { ac.innerHTML = '<div class="card"><p class="err">' + esc(e.message || e) + '</p></div>'; }
  })();
})();
