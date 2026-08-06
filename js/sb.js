/* Supabase 클라이언트 + 공용 데이터 계층 (Auth / DB / Storage).
   PHP API(catalog_api·media_upload·form_submit·auth)를 대체합니다. */
(function () {
  var cfg = window.DEMO_CONFIG;
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var BUCKET = cfg.STORAGE_BUCKET;

  // 다국어 정의 (원본 langs.php와 동일: 코드 → [이름, 이모지, ISO국가코드])
  var LANGS = {
    ko: ['한국어', '🇰🇷', 'kr'], en: ['English', '🇺🇸', 'us'], ja: ['日本語', '🇯🇵', 'jp'],
    zh: ['中文', '🇨🇳', 'cn'], vi: ['Tiếng Việt', '🇻🇳', 'vn'], th: ['ไทย', '🇹🇭', 'th'],
    es: ['Español', '🇪🇸', 'es'], id: ['Indonesia', '🇮🇩', 'id'], fr: ['Français', '🇫🇷', 'fr'], de: ['Deutsch', '🇩🇪', 'de']
  };

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
      var { data: old } = await sb.from('catalog_backups').select('id').eq('catalog_id', catalogId).order('created_at', { ascending: false }).range(30, 999);
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
})();
