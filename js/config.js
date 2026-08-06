
window.DEMO_CONFIG = {
  SUPABASE_URL: 'https://kzmydjrfygriuozqebin.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bXlkanJmeWdyaXVvenFlYmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Njc3NjAsImV4cCI6MjEwMTU0Mzc2MH0.zNl1cvuz7F6P1ab4XJsFfnqp_ClOdeaKZCGbrUR1IwQ', 

  // 이미지/영상 업로드 버킷 이름 (supabase_setup.sql 에서 생성)
  STORAGE_BUCKET: 'catalog-media',

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
