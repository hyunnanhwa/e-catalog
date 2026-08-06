-- ============================================================
--  전자카달로그 데모 — Supabase 세팅 (SQL Editor에서 전체 실행)
--  테이블 + RLS(사용자별 접근 권한) + Storage 버킷/정책
-- ============================================================

-- ── 1. 테이블 ──────────────────────────────────────────────
create table if not exists public.catalogs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null default '내 카달로그',
  aspect       text not null default '16:9',
  settings     jsonb not null default '{}'::jsonb,
  bgm_youtube  text,
  bgm_autoplay boolean not null default false,
  lang         text not null default 'ko',
  parent_id    uuid references public.catalogs(id) on delete cascade,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_catalogs_user on public.catalogs(user_id);

create table if not exists public.slides (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references public.catalogs(id) on delete cascade,
  sort_order  int not null default 0,
  bg_color    text,
  elements    jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists idx_slides_cat on public.slides(catalog_id, sort_order);

create table if not exists public.form_submissions (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references public.catalogs(id) on delete cascade,
  el_id       text,
  name        text, company text, phone text, email text, message text,
  created_at  timestamptz default now()
);
create index if not exists idx_subs_cat on public.form_submissions(catalog_id, created_at desc);

-- ── 2. RLS 활성화 ──────────────────────────────────────────
alter table public.catalogs        enable row level security;
alter table public.slides          enable row level security;
alter table public.form_submissions enable row level security;

-- catalogs: 누구나 조회(미리보기 링크 공개) / 본인만 생성·수정·삭제
drop policy if exists catalogs_read   on public.catalogs;
drop policy if exists catalogs_insert on public.catalogs;
drop policy if exists catalogs_update on public.catalogs;
drop policy if exists catalogs_delete on public.catalogs;
create policy catalogs_read   on public.catalogs for select using (true);
create policy catalogs_insert on public.catalogs for insert with check (auth.uid() = user_id);
create policy catalogs_update on public.catalogs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy catalogs_delete on public.catalogs for delete using (auth.uid() = user_id);

-- slides: 누구나 조회 / 카달로그 소유자만 쓰기
drop policy if exists slides_read on public.slides;
drop policy if exists slides_write on public.slides;
create policy slides_read on public.slides for select using (true);
create policy slides_write on public.slides for all
  using      (exists (select 1 from public.catalogs c where c.id = slides.catalog_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.catalogs c where c.id = slides.catalog_id and c.user_id = auth.uid()));

-- form_submissions: 누구나 접수(insert) / 소유자만 열람·삭제
drop policy if exists subs_insert on public.form_submissions;
drop policy if exists subs_read   on public.form_submissions;
drop policy if exists subs_delete on public.form_submissions;
create policy subs_insert on public.form_submissions for insert with check (true);
create policy subs_read   on public.form_submissions for select
  using (exists (select 1 from public.catalogs c where c.id = form_submissions.catalog_id and c.user_id = auth.uid()));
create policy subs_delete on public.form_submissions for delete
  using (exists (select 1 from public.catalogs c where c.id = form_submissions.catalog_id and c.user_id = auth.uid()));

-- ── 3. Storage 버킷(이미지/영상) ───────────────────────────
insert into storage.buckets (id, name, public)
values ('catalog-media', 'catalog-media', true)
on conflict (id) do nothing;

-- 공개 읽기 / 로그인 사용자는 본인 폴더(userid/…)에만 업로드
drop policy if exists media_read   on storage.objects;
drop policy if exists media_insert on storage.objects;
drop policy if exists media_update on storage.objects;
drop policy if exists media_delete on storage.objects;
create policy media_read   on storage.objects for select using (bucket_id = 'catalog-media');
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'catalog-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'catalog-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- 완료. (updated_at 자동 갱신은 앱(JS)에서 처리)
