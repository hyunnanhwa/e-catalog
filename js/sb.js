/* Supabase 클라이언트 + 공용 데이터 계층 (Auth / DB / Storage).
   PHP API(catalog_api·media_upload·form_submit·auth)를 대체합니다. */
(function () {
  var cfg = window.DEMO_CONFIG;
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var BUCKET = cfg.STORAGE_BUCKET;

  var API = {
    client: sb,

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

    // ── 슬라이드 ──
    async getSlides(catalogId) {
      var { data, error } = await sb.from('slides').select('*').eq('catalog_id', catalogId).order('sort_order');
      if (error) throw error; return data || [];
    },

    // ── 저장(에디터 save 대체): 슬라이드 upsert + 삭제 + 카달로그 설정 ──
    async saveCatalog(catalogId, payload) {
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
    }
  };

  window.API = API;
})();
