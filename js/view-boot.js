/* 뷰어 부트 — Supabase에서 카달로그를 읽어 cv-boot 생성(비로그인 방문자도 조회 가능).
   catalog-viewer.js는 그대로 재활용. 문의폼 전송(fetch 'sb:form')을 가로채 Supabase 저장 + EmailJS 발송. */
(function () {
  var CATALOG_ID = new URLSearchParams(location.search).get('id');
  if (!CATALOG_ID) { document.body.innerHTML = '<p style="font-family:sans-serif;padding:40px">잘못된 링크입니다. (?id= 필요)</p>'; return; }

  var cfg = window.DEMO_CONFIG;
  var ALL_ELS = [];   // 수신메일(to) 조회용

  // ── 문의폼 전송 인터셉터 ──
  var origFetch = window.fetch.bind(window);
  function jsonResp(obj) { return Promise.resolve({ ok: true, json: function () { return Promise.resolve(obj); } }); }
  function findTo(payload) {
    var id = payload.submit || payload.el || '';
    for (var i = 0; i < ALL_ELS.length; i++) {
      var e = ALL_ELS[i];
      if ((e.type === 'submit' || e.type === 'form') && e.id === id) return e.to || '';
    }
    // id 못 찾으면 아무 submit/form의 to
    for (var j = 0; j < ALL_ELS.length; j++) { if ((ALL_ELS[j].type === 'submit' || ALL_ELS[j].type === 'form') && ALL_ELS[j].to) return ALL_ELS[j].to; }
    return '';
  }
  function collectValues(payload) {
    if (payload.values) return payload.values;   // 개별 입력칸 방식
    return { name: payload.name, company: payload.company, phone: payload.phone, email: payload.email, message: payload.message };
  }
  async function sendEmail(to, vals, title) {
    if (!cfg.EMAILJS || !cfg.EMAILJS.ENABLED || !to || !window.emailjs) return;
    var L = { name: '이름', company: '회사명', phone: '전화번호', email: '이메일', message: '내용' };
    var body = '[' + (title || '카달로그') + '] 새 문의\n' + '--------------------\n';
    Object.keys(L).forEach(function (k) { if (vals[k]) body += L[k] + ': ' + vals[k] + '\n'; });
    try {
      await window.emailjs.send(cfg.EMAILJS.SERVICE_ID, cfg.EMAILJS.TEMPLATE_ID,
        { to_email: to, subject: '[카달로그] 새 문의 — ' + (vals.name || vals.company || '고객'), message: body });
    } catch (e) { /* 발송 실패해도 DB엔 저장됨 */ }
  }
  window.fetch = function (url, opts) {
    if (url === 'sb:form') {
      var payload = JSON.parse(opts.body);
      if (payload.website) return jsonResp({ ok: true });   // 허니팟
      var vals = collectValues(payload);
      var to = findTo(payload);
      return API.submitInquiry(CATALOG_ID, vals, payload.submit || payload.el || null)
        .then(function () { return sendEmail(to, vals, window.__CAT_TITLE__); })
        .then(function () { return jsonResp({ ok: true }); })
        .catch(function (e) { return jsonResp({ ok: false, err: String(e.message || e) }); });
    }
    return origFetch(url, opts);
  };

  (async function () {
    try {
      var cat = await API.getCatalog(CATALOG_ID);
      window.__CAT_TITLE__ = cat.title;
      document.title = cat.title || '카달로그';
      var rows = await API.getSlides(CATALOG_ID);
      var slides = rows.map(function (r) { var els = Array.isArray(r.elements) ? r.elements : []; ALL_ELS = ALL_ELS.concat(els); return { bg: r.bg_color, elements: els }; });
      var st = cat.settings || {};
      // 다국어: 같은 그룹의 모든 언어 버전 → 국기 스위처(원본 langs.php와 동일 구조)
      var langs = [];
      try {
        var sibs = await API.siblings(cat);
        if (sibs.length > 1) langs = sibs.map(function (s) { return { lang: s.lang, token: s.id, name: API.langName(s.lang), flag: API.langFlag(s.lang), cc: API.langCc(s.lang) }; });
      } catch (e) { /* 스위처 없이 진행 */ }
      var boot = {
        aspect: cat.aspect || '16:9', slides: slides,
        bgmYt: cat.bgm_youtube || '', autoplay: cat.bgm_autoplay ? 1 : 0, point: st.point || '#1a1a1a',
        outerBg: st.outerBg || '', outerImg: st.outerImg || '',
        outerOpacity: st.outerOpacity == null ? 1 : st.outerOpacity, outerBlur: st.outerBlur || 0,
        radius: st.radius == null ? 10 : st.radius,
        token: cat.id, formUrl: 'sb:form', langs: langs, curLang: cat.lang || 'ko', preview: false
      };
      var tag = document.createElement('script'); tag.type = 'application/json'; tag.id = 'cv-boot';
      tag.textContent = JSON.stringify(boot); document.body.appendChild(tag);
      // EmailJS SDK(옵션)
      if (cfg.EMAILJS && cfg.EMAILJS.ENABLED) {
        var ej = document.createElement('script'); ej.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        ej.onload = function () { try { window.emailjs.init({ publicKey: cfg.EMAILJS.PUBLIC_KEY }); } catch (e) {} };
        document.head.appendChild(ej);
      }
      var s = document.createElement('script'); s.src = 'assets/catalog-viewer.js'; document.body.appendChild(s);
    } catch (e) {
      document.getElementById('cv').innerHTML = '<p style="font-family:sans-serif;padding:40px">카달로그를 불러오지 못했습니다.<br>' + (e.message || e) + '</p>';
    }
  })();
})();
