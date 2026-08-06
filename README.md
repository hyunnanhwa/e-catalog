# 전자카달로그 — Serverless 데모 (Supabase + GitHub Pages)

PHP/MariaDB 없이 **정적 파일 + Supabase**(Auth·DB·Storage)로 동작하는 전자카달로그입니다.
기존 프로젝트의 **에디터/뷰어 UI·CSS·기능을 그대로 재활용**하고, 데이터 계층만 Supabase JS SDK로 교체했습니다.

```
demo_catalog/
├─ index.html          로그인 / 회원가입 (Supabase Auth)
├─ app.html            카달로그 대시보드 (기존 admin 사이드바 + cx-card 그대로)
├─ bgm.html            배경음악 페이지 (기존 bgm.php UI 재현)
├─ submissions.html    문의내역 페이지 (기존 submissions.php 재현)
├─ editor.html         에디터 (기존 catalog-editor.js 재활용)
├─ view.html           공개 미리보기 (?id=…, 비로그인 조회 가능)
├─ assets/             기존 CSS/JS 그대로 (editor·viewer·fonts·style·print)
├─ js/
│  ├─ config.js        ← Supabase / EmailJS 값 입력
│  ├─ sb.js            Supabase 데이터 계층(PHP API 대체)
│  ├─ shell.js         관리자 사이드바+상단바 공용 셸(기존 admin_header 재현)
│  ├─ app.js           대시보드 로직
│  ├─ bgm.js           배경음악 로직
│  ├─ subs.js          문의내역 로직
│  ├─ editor-boot.js   에디터 부트 + save/upload/crop 인터셉터
│  └─ view-boot.js     뷰어 부트 + 문의 전송(Supabase 저장 + 이메일)
├─ supabase_setup.sql  테이블 + RLS + Storage 설정
└─ README.md
```

## 1. Supabase 프로젝트 만들기
1. https://supabase.com → New project 생성 (Region: Northeast Asia / Seoul 권장).
2. **SQL Editor** → `supabase_setup.sql` 전체 붙여넣고 **Run**. (테이블·RLS·Storage 버킷 자동 생성)
3. **Project Settings → API** 에서 다음 두 값을 복사:
   - `Project URL`
   - `anon public` key
4. **Authentication → Providers → Email**: 데모를 바로 쓰려면 **"Confirm email" 끄기**(가입 즉시 로그인). 실서비스는 켜두세요.

## 2. 설정값 입력
`js/config.js` 를 열어 채웁니다:
```js
SUPABASE_URL: 'https://xxxx.supabase.co',
SUPABASE_ANON_KEY: 'eyJ...(anon public key)',
```

## 3. 로컬 확인 (선택)
정적 파일이라 아무 정적 서버로 열면 됩니다:
```bash
cd demo_catalog
python3 -m http.server 8000     # → http://localhost:8000/index.html
```
※ `file://` 로 직접 열면 CORS/모듈 문제로 안 됩니다. 반드시 http 서버로 여세요.

## 4. GitHub Pages 배포
1. 이 폴더를 GitHub 저장소에 push (예: 저장소 루트 또는 `/docs`).
2. 저장소 **Settings → Pages** → Branch: `main` / 폴더 선택 → Save.
3. 발급된 주소(`https://아이디.github.io/저장소/`)로 접속.
4. **Supabase → Authentication → URL Configuration** 의 `Site URL`·`Redirect URLs` 에 위 GitHub Pages 주소를 추가.

## 5. 문의폼 이메일 수신 (EmailJS)
정적 사이트라 서버 없이 **EmailJS**(client-side)로 이메일을 보냅니다.
1. https://www.emailjs.com 가입 → **Email Services** 연결(Gmail 등) → Service ID 확인.
2. **Email Templates** 새로 만들고, 템플릿 본문에 변수 사용:
   - 받는사람: `{{to_email}}`
   - 제목: `{{subject}}`
   - 내용: `{{message}}`
3. **Account → API Keys** 의 Public Key 확인.
4. `js/config.js` 의 `EMAILJS` 를 채우고 `ENABLED: true`:
```js
EMAILJS: { ENABLED:true, PUBLIC_KEY:'...', SERVICE_ID:'...', TEMPLATE_ID:'...' }
```
- 수신 주소는 **에디터 → 전송 버튼 속성 → '수신 이메일'** 에 업체가 넣은 값으로 갑니다.
- EmailJS를 안 켜도 문의는 **Supabase(문의내역)** 에 저장되어 마이페이지에서 확인됩니다.
- (참고) 수신 이메일 노출을 숨기려면 EmailJS 대신 **Supabase Edge Function + DB Webhook**(Resend 등)으로 서버측 발송 권장.

## 동작 메모
- **미리보기**(`view.html?id=…`)는 로그인 없이 누구나 조회 가능(RLS로 읽기만 공개).
- **이미지/영상 업로드**는 Supabase Storage(`catalog-media`)에 저장, 공개 URL로 렌더.
- **게시하기 버튼은 없음**(요청). 저장하면 링크 공유로 바로 노출됩니다.
- 다국어(언어별 복제)·PDF 인쇄·자동 AI번역은 데모에서 제외(원본 프로젝트 기능).
