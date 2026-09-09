/* Supabase 클라이언트 + 공용 데이터 계층 (Auth / DB / Storage).
   PHP API(catalog_api·media_upload·form_submit·auth)를 대체합니다. */
(function () {
  var cfg = window.DEMO_CONFIG || {};

  // 다국어 정의 (원본 langs.php와 동일: 코드 → [이름, 이모지, ISO국가코드])
  var LANGS = {
    ko: ['한국어', '🇰🇷', 'kr'], en: ['English', '🇺🇸', 'us'], ja: ['日本語', '🇯🇵', 'jp'],
    zh: ['中文', '🇨🇳', 'cn'], vi: ['Tiếng Việt', '🇻🇳', 'vn'], th: ['ไทย', '🇹🇭', 'th'],
    es: ['Español', '🇪🇸', 'es'], id: ['Indonesia', '🇮🇩', 'id'], fr: ['Français', '🇫🇷', 'fr'], de: ['Deutsch', '🇩🇪', 'de']
  };

  // config가 아직 placeholder면 → 로컬 데모모드(브라우저 localStorage 백엔드). Supabase 값 넣으면 자동으로 실서버 전환.
  var DEMO = !cfg.SUPABASE_URL || /YOUR-PROJECT/.test(cfg.SUPABASE_URL) || /YOUR-ANON/.test(cfg.SUPABASE_ANON_KEY || '');
  if (DEMO) { window.API = buildDemoAPI(LANGS); return; }

  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var BUCKET = cfg.STORAGE_BUCKET;

  var API = {
    client: sb,
    LANGS: LANGS,
    langName: function (c) { return (LANGS[c] || [c])[0]; },
    langFlag: function (c) { return (LANGS[c] || ['', '🏳️'])[1]; },
    langCc: function (c) { return (LANGS[c] || ['', '', 'un'])[2]; },

    // ── 인증 ──
    async signUp(email, password) {
      var { data, error } = await sb.auth.signUp({ email: email, password: password });
      if (error) throw error; return data;
    },
    async signIn(email, password) {
      var { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
      if (error) throw error; return data;
    },
    async signOut() { await sb.auth.signOut(); },
    async user() { var { data } = await sb.auth.getUser(); return data ? data.user : null; },
    async requireUser() { var u = await API.user(); if (!u) { location.href = 'index.html'; throw new Error('로그인 필요'); } return u; },

    // ── 카달로그 ──
    async myCatalogs() {
      var u = await API.requireUser();
      var { data, error } = await sb.from('catalogs').select('*').eq('user_id', u.id).is('parent_id', null).order('created_at');
      if (error) throw error; return data || [];
    },
    async getCatalog(id) {
      var { data, error } = await sb.from('catalogs').select('*').eq('id', id).single();
      if (error) throw error; return data;
    },
    async createCatalog(title) {
      var u = await API.requireUser();
      var { data, error } = await sb.from('catalogs').insert({ user_id: u.id, title: title || '내 카달로그' }).select().single();
      if (error) throw error;
      await sb.from('slides').insert({ catalog_id: data.id, sort_order: 0, elements: [] });
      return data;
    },
    async updateCatalog(id, patch) {
      patch.updated_at = new Date().toISOString();
      var { error } = await sb.from('catalogs').update(patch).eq('id', id);
      if (error) throw error;
    },
    async deleteCatalog(id) {
      var { error } = await sb.from('catalogs').delete().eq('id', id);
      if (error) throw error;
    },

    // 내 카달로그 전체(언어 사본 포함) — 대시보드 그룹핑용
    async allMyCatalogs() {
      var u = await API.requireUser();
      var { data, error } = await sb.from('catalogs').select('*').eq('user_id', u.id).order('created_at');
      if (error) throw error; return data || [];
    },

    // 언어 그룹의 모든 버전(원본 먼저) — 뷰어 국기 스위처/대시보드 공용. 비로그인도 조회 가능(RLS public read).
    async siblings(cat) {
      var root = cat.parent_id || cat.id;
      var { data, error } = await sb.from('catalogs')
        .select('id,lang,title,parent_id,settings,bgm_youtube,bgm_autoplay,created_at')
        .or('id.eq.' + root + ',parent_id.eq.' + root);
      if (error) throw error;
      return (data || []).sort(function (a, b) {
        if (!a.parent_id && b.parent_id) return -1;
        if (a.parent_id && !b.parent_id) return 1;
        return (a.created_at || '') < (b.created_at || '') ? -1 : 1;
      });
    },

    // 언어 추가 = 원본(그룹 루트) 복제 + 슬라이드 복제 (parent_id=root, lang=새언어)
    async addLanguage(baseId, lang) {
      if (!LANGS[lang]) throw new Error('지원하지 않는 언어입니다.');
      var u = await API.requireUser();
      var base = await API.getCatalog(baseId);
      var root = base.parent_id || base.id;
      var { data: exist } = await sb.from('catalogs').select('id').or('id.eq.' + root + ',parent_id.eq.' + root).eq('lang', lang);
      if (exist && exist.length) throw new Error('이미 있는 언어입니다.');
      var { data: nc, error } = await sb.from('catalogs').insert({
        user_id: u.id, title: base.title, aspect: base.aspect, settings: base.settings || {},
        bgm_youtube: base.bgm_youtube || null, bgm_autoplay: base.bgm_autoplay || false,
        lang: lang, parent_id: root
      }).select().single();
      if (error) throw error;
      var slides = await API.getSlides(baseId);
      var rows = slides.length
        ? slides.map(function (s, i) { return { catalog_id: nc.id, sort_order: i, bg_color: s.bg_color, elements: s.elements || [] }; })
        : [{ catalog_id: nc.id, sort_order: 0, elements: [] }];
      var { error: e2 } = await sb.from('slides').insert(rows);
      if (e2) throw e2;
      return nc;
    },

    // ── 슬라이드 ──
    async getSlides(catalogId) {
      var { data, error } = await sb.from('slides').select('*').eq('catalog_id', catalogId).order('sort_order');
      if (error) throw error; return data || [];
    },

    // ── 저장(에디터 save 대체): 슬라이드 upsert + 삭제 + 카달로그 설정 ──
    async saveCatalog(catalogId, payload) {
      // 0) 저장 직전 상태 자동 백업(원본 catalog_api 동작)
      try { await API._snapshot(catalogId, 'save'); } catch (e) { /* 백업 실패해도 저장은 진행 */ }
      // 1) 카달로그 레벨(aspect, settings)
      await API.updateCatalog(catalogId, { aspect: payload.aspect || '16:9', settings: payload.settings || {} });
      // 2) 슬라이드 반영
      var idMap = {}, keepIds = [];
      var order = 0;
      for (var i = 0; i < payload.slides.length; i++) {
        var s = payload.slides[i];
        var row = { catalog_id: catalogId, sort_order: order++, bg_color: s.bg || null, elements: s.elements || [] };
        if (s.id && typeof s.id === 'string' && s.id.length > 10) {
          var { error: e1 } = await sb.from('slides').update(row).eq('id', s.id);
          if (e1) throw e1; keepIds.push(s.id);
        } else {
          var { data: ins, error: e2 } = await sb.from('slides').insert(row).select('id').single();
          if (e2) throw e2; keepIds.push(ins.id);
          if (s.tmpid) idMap[s.tmpid] = ins.id;
        }
      }
      // 3) 목록에 없는 슬라이드 삭제
      var existing = await API.getSlides(catalogId);
      for (var j = 0; j < existing.length; j++) {
        if (keepIds.indexOf(existing[j].id) < 0) await sb.from('slides').delete().eq('id', existing[j].id);
      }
      return { ok: true, idMap: idMap, slideIds: keepIds };
    },

    // ── 업로드(media_upload 대체): Supabase Storage ──
    async uploadFile(file) {
      var u = await API.requireUser();
      var ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      var path = u.id + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      var { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      var { data } = sb.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },

    // ── 문의 접수(form_submit 대체) ──
    async submitInquiry(catalogId, vals, elId) {
      var { error } = await sb.from('form_submissions').insert({
        catalog_id: catalogId, el_id: elId || null,
        name: vals.name || null, company: vals.company || null, phone: vals.phone || null,
        email: vals.email || null, message: vals.message || null
      });
      if (error) throw error;
    },
    async myInquiries(catalogIds) {
      var { data, error } = await sb.from('form_submissions').select('*').in('catalog_id', catalogIds).order('created_at', { ascending: false });
      if (error) throw error; return data || [];
    },

    // ── 미디어(Storage) 목록/삭제 ──
    async listMedia() {
      var u = await API.requireUser();
      var { data, error } = await sb.storage.from(BUCKET).list(u.id, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      return (data || []).filter(function (f) { return f.id; }).map(function (f) {
        var path = u.id + '/' + f.name;
        return { name: f.name, path: path, url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, size: (f.metadata && f.metadata.size) || 0, created: f.created_at };
      });
    },
    async deleteMedia(path) {
      var { error } = await sb.storage.from(BUCKET).remove([path]);
      if (error) throw error;
    },

    // ── 환경설정: 포인트 컬러(내 모든 카달로그에 일괄 적용, 뷰어 settings.point) ──
    async getPointColor() {
      var cats = await API.myCatalogs();
      for (var i = 0; i < cats.length; i++) { var st = cats[i].settings || {}; if (st.point) return st.point; }
      return '#1a1a1a';
    },
    async setPointColor(hex) {
      var cats = await API.myCatalogs();
      for (var i = 0; i < cats.length; i++) {
        var st = cats[i].settings || {}; st.point = hex;
        await sb.from('catalogs').update({ settings: st, updated_at: new Date().toISOString() }).eq('id', cats[i].id);
      }
      return cats.length;
    },

    // ── 편집 백업(catalog_backups): 저장 직전 스냅샷 + 복원 + 최근 30개 유지 ──
    async _snapshot(catalogId, reason) {
      var slides = await API.getSlides(catalogId);
      if (!slides.length) return;
      var cat = await API.getCatalog(catalogId);
      var snap = {
        aspect: cat.aspect || '16:9', settings: cat.settings || {},
        slides: slides.map(function (s) { return { sort_order: s.sort_order, bg_color: s.bg_color, elements: s.elements || [] }; })
      };
      await sb.from('catalog_backups').insert({ catalog_id: catalogId, snapshot: snap, slide_count: slides.length, reason: reason || 'save' });
      var { data: old } = await sb.from('catalog_backups').select('id').eq('catalog_id', catalogId).order('created_at', { ascending: false }).range(10, 999);
      if (old && old.length) await sb.from('catalog_backups').delete().in('id', old.map(function (b) { return b.id; }));
    },
    async listBackups(catalogId) {
      var { data, error } = await sb.from('catalog_backups').select('id,slide_count,reason,created_at').eq('catalog_id', catalogId).order('created_at', { ascending: false });
      if (error) throw error; return data || [];
    },
    async restoreBackup(backupId, catalogId) {
      var { data: bk, error } = await sb.from('catalog_backups').select('*').eq('id', backupId).single();
      if (error) throw error;
      var snap = bk.snapshot;
      if (!snap || !Array.isArray(snap.slides)) throw new Error('백업 데이터가 올바르지 않습니다.');
      await API._snapshot(catalogId, 'restore');   // 복원 직전 현재본도 백업(되돌리기 가능)
      var existing = await API.getSlides(catalogId);
      for (var i = 0; i < existing.length; i++) await sb.from('slides').delete().eq('id', existing[i].id);
      var rows = snap.slides.map(function (s, idx) { return { catalog_id: catalogId, sort_order: idx, bg_color: s.bg_color || null, elements: s.elements || [] }; });
      if (rows.length) { var { error: e2 } = await sb.from('slides').insert(rows); if (e2) throw e2; }
      await API.updateCatalog(catalogId, { aspect: snap.aspect || '16:9', settings: snap.settings || {} });
    },
    async deleteBackup(backupId) {
      var { error } = await sb.from('catalog_backups').delete().eq('id', backupId);
      if (error) throw error;
    }
  };

  window.API = API;

  // ══════════════════════════════════════════════════════════════
  //  데모모드 목(mock) API — Supabase 미설정 시 브라우저 localStorage로 동작.
  //  실제 sb.js API와 동일한 인터페이스(같은 반환 형태)를 제공한다.
  // ══════════════════════════════════════════════════════════════
  function buildDemoAPI(LANGS) {
    var KEY = 'ECAT_DEMO_DB', SKEY = 'ECAT_DEMO_SESSION';
    function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10); }
    function now() { return new Date().toISOString(); }
    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function db() { var d = load(); d.users = d.users || []; d.catalogs = d.catalogs || []; d.slides = d.slides || []; d.subs = d.subs || []; d.backups = d.backups || []; d.media = d.media || []; return d; }
    function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { alert('데모 저장 용량 초과 — 큰 이미지는 데모모드에서 제한될 수 있어요. (실서버는 Supabase Storage 사용)'); } }
    function sid() { return localStorage.getItem(SKEY) || null; }
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function langName(c) { return (LANGS[c] || [c])[0]; }

    function curUser() { var d = db(), id = sid(); if (!id) return null; return d.users.filter(function (u) { return u.id === id; })[0] || null; }

    // 신규 데모 사용자용 샘플 카달로그(표지·소개·문의 3장)
    function sampleSlides() {
      return [
        { bg: '#0b1220', elements: [
          { type: 'box', x: 0, y: 0, w: 100, h: 100, z: 1, fillType: 'gradient', color1: '#1e3a8a', color2: '#7c3aed', gradAngle: 135, radius: 0 },
          { type: 'text', x: 10, y: 33, w: 80, h: 16, z: 3, html: '선영디자인', size: 8, align: 'center', color: '#ffffff', fw: 800, aos: 'fade-up' },
          { type: 'text', x: 10, y: 52, w: 80, h: 8, z: 3, html: '전자카달로그 · 인터랙티브 데모', size: 2.8, align: 'center', color: '#c7d2fe', fw: 500, aos: 'fade-up', aosDelay: 150 }
        ]},
        { bg: '#ffffff', elements: [
          { type: 'box', x: 0, y: 0, w: 34, h: 100, z: 1, fillType: 'gradient', color1: '#06b6d4', color2: '#3b82f6', gradAngle: 160, radius: 0 },
          { type: 'text', x: 6, y: 20, w: 24, h: 30, z: 2, html: '고급 인쇄,<br>정교한 디자인', size: 4.4, align: 'left', color: '#ffffff', fw: 800, lh: 1.2, aos: 'fade-right' },
          { type: 'text', x: 40, y: 20, w: 54, h: 30, z: 2, html: '브로슈어·카달로그·패키지까지. 파워포인트처럼 편집하고, 링크 하나로 어디서든 열람하세요.', size: 2.3, align: 'left', color: '#334155', lh: 1.7, aos: 'fade-up' },
          { type: 'text', x: 40, y: 56, w: 54, h: 30, z: 2, html: '✓ PPT형 드래그 편집<br>✓ 이미지·영상·배경음악<br>✓ 다국어 국기 전환<br>✓ 문의폼 이메일 접수', size: 2.3, align: 'left', color: '#0f766e', fw: 700, lh: 2.0, aos: 'fade-up', aosDelay: 150 }
        ]},
        { bg: '#0f172a', elements: [
          { type: 'text', x: 10, y: 8, w: 80, h: 10, z: 2, html: '문의하기', size: 4.4, align: 'center', color: '#ffffff', fw: 800, aos: 'fade-up' },
          { type: 'text', x: 10, y: 17, w: 80, h: 6, z: 2, html: '아래 양식을 남겨 주시면 담당자가 연락드립니다.', size: 2, align: 'center', color: '#94a3b8', aos: 'fade-up' },
          { type: 'field', id: 'f_name', fk: 'name', x: 27, y: 26, w: 46, h: 9, z: 2, size: 2, color: '#e2e8f0', labelColor: '#cbd5e1', bg: '#ffffff', radius: 8 },
          { type: 'field', id: 'f_phone', fk: 'phone', x: 27, y: 37, w: 46, h: 9, z: 2, size: 2, color: '#e2e8f0', labelColor: '#cbd5e1', bg: '#ffffff', radius: 8 },
          { type: 'field', id: 'f_email', fk: 'email', x: 27, y: 48, w: 46, h: 9, z: 2, size: 2, color: '#e2e8f0', labelColor: '#cbd5e1', bg: '#ffffff', radius: 8 },
          { type: 'field', id: 'f_msg', fk: 'message', x: 27, y: 59, w: 46, h: 16, z: 2, size: 2, color: '#e2e8f0', labelColor: '#cbd5e1', bg: '#ffffff', radius: 8 },
          { type: 'submit', id: 's_1', x: 27, y: 78, w: 46, h: 8, z: 2, text: '문의 보내기', bg: '#06b6d4', color: '#ffffff', size: 2.3, radius: 8, to: 'demo@example.com' }
        ]}
      ];
    }
    async function seedSample(userId) {
      var d = db(), cid = uid();
      d.catalogs.push({ id: cid, user_id: userId, title: '선영디자인 데모 카달로그', aspect: '16:9', settings: { point: '#06b6d4' }, bgm_youtube: 'JmQEkWAUG7k', bgm_autoplay: false, lang: 'ko', parent_id: null, created_at: now(), updated_at: now() });
      sampleSlides().forEach(function (s, i) { d.slides.push({ id: uid(), catalog_id: cid, sort_order: i, bg_color: s.bg, elements: s.elements, created_at: now() }); });
      save(d);
      try { await M.addLanguage(cid, 'en'); } catch (e) {}   // 영어 버전 → 미리보기 국기 전환 시연
    }

    var M = {
      __demo: true, LANGS: LANGS,
      langName: langName,
      langFlag: function (c) { return (LANGS[c] || ['', '🏳️'])[1]; },
      langCc: function (c) { return (LANGS[c] || ['', '', 'un'])[2]; },

      // ── 인증 ──
      async signUp(email, password) {
        var d = db();
        if (d.users.some(function (u) { return u.email === email; })) throw new Error('이미 가입된 이메일입니다.');
        if ((password || '').length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다.');
        var u = { id: uid(), email: email, password: password }; d.users.push(u); save(d);
        localStorage.setItem(SKEY, u.id);
        try { await seedSample(u.id); } catch (e) {}
        return { user: { id: u.id, email: email }, session: { user: { id: u.id } } };
      },
      async signIn(email, password) {
        var d = db(), u = d.users.filter(function (x) { return x.email === email; })[0];
        if (!u || u.password !== password) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        localStorage.setItem(SKEY, u.id); return { user: { id: u.id, email: email } };
      },
      async signOut() { localStorage.removeItem(SKEY); },
      async user() { var u = curUser(); return u ? { id: u.id, email: u.email } : null; },
      async requireUser() { var u = await M.user(); if (!u) { location.href = 'index.html'; throw new Error('로그인 필요'); } return u; },

      // ── 카달로그 ──
      async myCatalogs() { var d = db(), id = sid(); return d.catalogs.filter(function (c) { return c.user_id === id && !c.parent_id; }).sort(byCreated); },
      async allMyCatalogs() { var d = db(), id = sid(); return d.catalogs.filter(function (c) { return c.user_id === id; }).sort(byCreated); },
      async getCatalog(cid) { var d = db(), c = d.catalogs.filter(function (x) { return x.id === cid; })[0]; if (!c) throw new Error('카달로그를 찾을 수 없습니다.'); return clone(c); },
      async createCatalog(title) {
        var d = db(), id = sid();
        var c = { id: uid(), user_id: id, title: title || '내 카달로그', aspect: '16:9', settings: {}, bgm_youtube: null, bgm_autoplay: false, lang: 'ko', parent_id: null, created_at: now(), updated_at: now() };
        d.catalogs.push(c); d.slides.push({ id: uid(), catalog_id: c.id, sort_order: 0, bg_color: null, elements: [], created_at: now() }); save(d); return clone(c);
      },
      async updateCatalog(cid, patch) { var d = db(); d.catalogs.forEach(function (c) { if (c.id === cid) { for (var k in patch) c[k] = patch[k]; c.updated_at = now(); } }); save(d); },
      async deleteCatalog(cid) {
        var d = db();
        var kill = d.catalogs.filter(function (c) { return c.id === cid || c.parent_id === cid; }).map(function (c) { return c.id; });
        d.catalogs = d.catalogs.filter(function (c) { return kill.indexOf(c.id) < 0; });
        d.slides = d.slides.filter(function (s) { return kill.indexOf(s.catalog_id) < 0; });
        d.subs = d.subs.filter(function (s) { return kill.indexOf(s.catalog_id) < 0; });
        d.backups = d.backups.filter(function (b) { return kill.indexOf(b.catalog_id) < 0; });
        save(d);
      },
      async siblings(cat) {
        var d = db(), root = cat.parent_id || cat.id;
        return d.catalogs.filter(function (c) { return c.id === root || c.parent_id === root; })
          .sort(function (a, b) { if (!a.parent_id && b.parent_id) return -1; if (a.parent_id && !b.parent_id) return 1; return byCreated(a, b); }).map(clone);
      },
      async addLanguage(baseId, lang) {
        if (!LANGS[lang]) throw new Error('지원하지 않는 언어입니다.');
        var d = db(), id = sid(), base = d.catalogs.filter(function (c) { return c.id === baseId; })[0];
        if (!base) throw new Error('원본을 찾을 수 없습니다.');
        var root = base.parent_id || base.id;
        if (d.catalogs.some(function (c) { return (c.id === root || c.parent_id === root) && c.lang === lang; })) throw new Error('이미 있는 언어입니다.');
        var nc = { id: uid(), user_id: id, title: base.title, aspect: base.aspect, settings: clone(base.settings || {}), bgm_youtube: base.bgm_youtube, bgm_autoplay: base.bgm_autoplay, lang: lang, parent_id: root, created_at: now(), updated_at: now() };
        d.catalogs.push(nc);
        var src = d.slides.filter(function (s) { return s.catalog_id === baseId; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
        if (!src.length) src = [{ elements: [], bg_color: null }];
        src.forEach(function (s, i) { d.slides.push({ id: uid(), catalog_id: nc.id, sort_order: i, bg_color: s.bg_color || null, elements: clone(s.elements || []), created_at: now() }); });
        save(d); return clone(nc);
      },

      // ── 슬라이드 / 저장 ──
      async getSlides(cid) { var d = db(); return d.slides.filter(function (s) { return s.catalog_id === cid; }).sort(function (a, b) { return a.sort_order - b.sort_order; }).map(clone); },
      async saveCatalog(cid, payload) {
        try { await M._snapshot(cid, 'save'); } catch (e) {}
        await M.updateCatalog(cid, { aspect: payload.aspect || '16:9', settings: payload.settings || {} });
        var d = db(), idMap = {}, keepIds = [], order = 0;
        (payload.slides || []).forEach(function (s) {
          var existing = (s.id && typeof s.id === 'string' && s.id.length > 10) ? d.slides.filter(function (x) { return x.id === s.id; })[0] : null;
          if (existing) { existing.sort_order = order++; existing.bg_color = s.bg || null; existing.elements = s.elements || []; keepIds.push(existing.id); }
          else { var nid = uid(); d.slides.push({ id: nid, catalog_id: cid, sort_order: order++, bg_color: s.bg || null, elements: s.elements || [], created_at: now() }); keepIds.push(nid); if (s.tmpid) idMap[s.tmpid] = nid; }
        });
        d.slides = d.slides.filter(function (s) { return s.catalog_id !== cid || keepIds.indexOf(s.id) >= 0; });
        save(d); return { ok: true, idMap: idMap, slideIds: keepIds };
      },

      // ── 업로드(Storage 대체): dataURL로 저장 ──
      async uploadFile(file) {
        var url = await new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); });
        var d = db(); d.media.unshift({ path: uid(), name: file.name, url: url, size: file.size || 0, created: now(), user_id: sid() }); save(d);
        return url;
      },
      async listMedia() { var d = db(), id = sid(); return d.media.filter(function (m) { return m.user_id === id; }).map(clone); },
      async deleteMedia(path) { var d = db(); d.media = d.media.filter(function (m) { return m.path !== path; }); save(d); },

      // ── 문의 ──
      async submitInquiry(cid, vals, elId) {
        var d = db(); d.subs.unshift({ id: uid(), catalog_id: cid, el_id: elId || null, name: vals.name || null, company: vals.company || null, phone: vals.phone || null, email: vals.email || null, message: vals.message || null, created_at: now() }); save(d);
      },
      async myInquiries(cids) { var d = db(); return d.subs.filter(function (s) { return cids.indexOf(s.catalog_id) >= 0; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }).map(clone); },

      // ── 환경설정(포인트 컬러) ──
      async getPointColor() { var cats = await M.myCatalogs(); for (var i = 0; i < cats.length; i++) { if (cats[i].settings && cats[i].settings.point) return cats[i].settings.point; } return '#1a1a1a'; },
      async setPointColor(hex) { var cats = await M.myCatalogs(); for (var i = 0; i < cats.length; i++) { var st = cats[i].settings || {}; st.point = hex; await M.updateCatalog(cats[i].id, { settings: st }); } return cats.length; },

      // ── 편집 백업 ──
      async _snapshot(cid, reason) {
        var slides = await M.getSlides(cid); if (!slides.length) return;
        var cat = await M.getCatalog(cid), d = db();
        d.backups.unshift({ id: uid(), catalog_id: cid, snapshot: { aspect: cat.aspect || '16:9', settings: cat.settings || {}, slides: slides.map(function (s) { return { sort_order: s.sort_order, bg_color: s.bg_color, elements: s.elements || [] }; }) }, slide_count: slides.length, reason: reason || 'save', created_at: now() });
        var mine = d.backups.filter(function (b) { return b.catalog_id === cid; });
        if (mine.length > 10) { var keep = mine.slice(0, 10).map(function (b) { return b.id; }); d.backups = d.backups.filter(function (b) { return b.catalog_id !== cid || keep.indexOf(b.id) >= 0; }); }
        save(d);
      },
      async listBackups(cid) { var d = db(); return d.backups.filter(function (b) { return b.catalog_id === cid; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }).map(function (b) { return { id: b.id, slide_count: b.slide_count, reason: b.reason, created_at: b.created_at }; }); },
      async restoreBackup(bid, cid) {
        var d = db(), bk = d.backups.filter(function (b) { return b.id === bid; })[0];
        if (!bk || !bk.snapshot || !Array.isArray(bk.snapshot.slides)) throw new Error('백업 데이터가 올바르지 않습니다.');
        await M._snapshot(cid, 'restore'); d = db();
        d.slides = d.slides.filter(function (s) { return s.catalog_id !== cid; });
        bk.snapshot.slides.forEach(function (s, i) { d.slides.push({ id: uid(), catalog_id: cid, sort_order: i, bg_color: s.bg_color || null, elements: s.elements || [], created_at: now() }); });
        d.catalogs.forEach(function (c) { if (c.id === cid) { c.aspect = bk.snapshot.aspect || '16:9'; c.settings = bk.snapshot.settings || {}; c.updated_at = now(); } });
        save(d);
      },
      async deleteBackup(bid) { var d = db(); d.backups = d.backups.filter(function (b) { return b.id !== bid; }); save(d); }
    };
    function byCreated(a, b) { return (a.created_at || '') < (b.created_at || '') ? -1 : 1; }
    return M;
  }
})();
