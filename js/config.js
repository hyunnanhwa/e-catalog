/* ───────────────────────────────────────────────────────────
   설정 — 아래 3곳을 본인 Supabase / EmailJS 값으로 채우세요.
   (README.md 참고)
   ─────────────────────────────────────────────────────────── */
window.DEMO_CONFIG = {
  // Supabase 프로젝트 설정 > API 에서 복사
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',

  // 이미지/영상 업로드 버킷 이름 (supabase_setup.sql 에서 생성)
  STORAGE_BUCKET: 'catalog-media',

  // AI 채팅(Gemini) — Supabase Edge Function 'catalog-chat' 배포 후 켜기. API 키는 여기 넣지 말고 Supabase 비밀값(GEMINI_API_KEY)에만.
  AI_CHAT: {
    ENABLED: true,
    FUNCTION: 'catalog-chat'
  },

  // 문의폼 이메일 발송 (EmailJS). 안 쓰면 그대로 두면 DB에만 저장됨.
  // https://www.emailjs.com → Email Services / Templates 에서 발급
  EMAILJS: {
    ENABLED: false,                 // 이메일 발송 켜려면 true
    PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',
    SERVICE_ID: 'YOUR_SERVICE_ID',
    TEMPLATE_ID: 'YOUR_TEMPLATE_ID'
    // 템플릿 변수: to_email, subject, message (아래 view-boot.js 참고)
  }
};
