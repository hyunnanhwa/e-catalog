/* 에디터 부트 — Supabase에서 카달로그를 읽어 ed-boot를 만들고,
   catalog-editor.js가 쓰는 fetch(save/upload/crop)를 Supabase로 가로챈다.
   catalog-editor.js 자체는 수정 없이 그대로 재활용. */
(function () {
  var CATALOG_ID = new URLSearchParams(location.search).get('id');
  if (!CATALOG_ID) { location.href = 'app.html'; return; }

  // ── fetch 인터셉터 (PHP API 대체) ──
  var origFetch = window.fetch.bind(window);
  function jsonResp(obj) { return Promise.resolve({ ok: true, json: function () { return Promise.resolve(obj); } }); }
  function imgDims(url) { return new Promise(function (res) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { res({ w: im.naturalWidth, h: im.naturalHeight }); }; im.onerror = function () { res({ w: 0, h: 0 }); }; im.src = url; }); }
  function cropToBlob(src, x, y, w, h) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        var nw = im.naturalWidth, nh = im.naturalHeight;
        var sx = Math.round(x * nw), sy = Math.round(y * nh), sw = Math.max(1, Math.round(w * nw)), sh = Math.max(1, Math.round(h * nh));
        var cv = document.createElement('canvas'); cv.width = sw; cv.height = sh;
        cv.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
        cv.toBlob(function (b) { b ? res(b) : rej(new Error('crop 실패')); }, 'image/png');
      };
      im.onerror = function () { rej(new Error('이미지 로드 실패')); };
      im.src = src;
    });
  }
  window.fetch = function (url, opts) {
    try {
      if (url === 'sb:save') {
        var p = JSON.parse(opts.body);
        return API.saveCatalog(CATALOG_ID, p).then(jsonResp).catch(function (e) { return jsonResp({ ok: false, err: String(e.message || e) }); });
      }
      if (url === 'sb:upload') {
        var file = opts.body.get('file');
        return API.uploadFile(file).then(function (u) { return imgDims(u).then(function (d) { return jsonResp({ ok: true, url: u, w: d.w, h: d.h }); }); })
          .catch(function (e) { return jsonResp({ ok: false, err: String(e.message || e) }); });
      }
      if (url === 'sb:crop') {
        var q = JSON.parse(opts.body);
        return cropToBlob(q.src, q.x, q.y, q.w, q.h)
          .then(function (blob) { return API.uploadFile(new File([blob], 'crop.png', { type: 'image/png' })); })
          .then(function (u) { return jsonResp({ ok: true, url: u }); })
          .catch(function (e) { return jsonResp({ ok: false, err: String(e.message || e) }); });
      }
    } catch (e) { return jsonResp({ ok: false, err: String(e) }); }
    return origFetch(url, opts);
  };

  // ── 부트 구성 후 에디터 로드 ──
  (async function () {
    try {
      await API.requireUser();
      var cat = await API.getCatalog(CATALOG_ID);
      var slidesRows = await API.getSlides(CATALOG_ID);
      var slides = slidesRows.map(function (r) { return { id: r.id, bg: r.bg_color, elements: Array.isArray(r.elements) ? r.elements : [] }; });
      if (!slides.length) slides.push({ id: 0, bg: null, elements: [] });
      var st = cat.settings || {};
      var boot = {
        catalogId: cat.id, title: cat.title, aspect: cat.aspect || '16:9', token: cat.id,
        slides: slides,
        settings: { outerBg: st.outerBg || '', outerImg: st.outerImg || '', outerOpacity: st.outerOpacity == null ? 1 : st.outerOpacity, outerBlur: st.outerBlur || 0, radius: st.radius, guidesV: st.guidesV || [], guidesH: st.guidesH || [] },
        csrf: 'demo', saveUrl: 'sb:save', uploadUrl: 'sb:upload', cropUrl: 'sb:crop', viewUrl: 'view.html?id=' + cat.id
      };
      var tag = document.createElement('script'); tag.type = 'application/json'; tag.id = 'ed-boot';
      tag.textContent = JSON.stringify(boot);
      document.body.appendChild(tag);
      // 에디터 스크립트 로드(부트 준비 후)
      var s = document.createElement('script'); s.src = 'assets/catalog-editor.js'; document.body.appendChild(s);
    } catch (e) {
      document.getElementById('editor').innerHTML = '<div style="padding:40px;font-family:sans-serif">카달로그를 불러오지 못했습니다.<br>' + (e.message || e) + '</div>';
    }
  })();
})();
