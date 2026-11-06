-- ============================================================
--  전자카달로그 데모 — AI 채팅 추가 설정 (SQL Editor에서 전체 실행)
--  supabase_setup.sql 을 이미 실행한 프로젝트에 추가로 실행. 여러 번 실행해도 안전.
-- ============================================================

-- 1. AI 참고 정보(비공개): 슬라이드는 공개 조회라서 참고 정보는 여기 따로 저장. 소유자만 읽고 쓰기.
create table if not exists public.chat_private (
  catalog_id  uuid not null references public.catalogs(id) on delete cascade,
  el_id       text not null,
  info        text not null default '',
  updated_at  timestamptz default now(),
  primary key (catalog_id, el_id)
);
alter table public.chat_private enable row level security;
drop policy if exists chat_private_owner on public.chat_private;
create policy chat_private_owner on public.chat_private for all
  using      (exists (select 1 from public.catalogs c where c.id = chat_private.catalog_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.catalogs c where c.id = chat_private.catalog_id and c.user_id = auth.uid()));

-- 2. 대화 기록: 쓰기는 Edge Function(서비스 권한)만, 열람·삭제는 카달로그 소유자만
create table if not exists public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references public.catalogs(id) on delete cascade,
  el_id       text,
  sid         text not null unique,          -- 방문자 브라우저가 만든 대화 id
  ip          text,
  ua          text,
  msg_count   int not null default 0,        -- 받은 질문 수
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_chat_sessions_cat on public.chat_sessions(catalog_id, updated_at desc);

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  catalog_id  uuid not null references public.catalogs(id) on delete cascade,
  ip          text,
  role        text not null check (role in ('user','ai')),
  content     text not null,
  created_at  timestamptz default now()
);
create index if not exists idx_chat_messages_sess on public.chat_messages(session_id, created_at);
create index if not exists idx_chat_messages_ip on public.chat_messages(ip, created_at);
create index if not exists idx_chat_messages_cat on public.chat_messages(catalog_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
drop policy if exists chat_sessions_owner_read on public.chat_sessions;
drop policy if exists chat_sessions_owner_del  on public.chat_sessions;
drop policy if exists chat_messages_owner_read on public.chat_messages;
create policy chat_sessions_owner_read on public.chat_sessions for select
  using (exists (select 1 from public.catalogs c where c.id = chat_sessions.catalog_id and c.user_id = auth.uid()));
create policy chat_sessions_owner_del on public.chat_sessions for delete
  using (exists (select 1 from public.catalogs c where c.id = chat_sessions.catalog_id and c.user_id = auth.uid()));
create policy chat_messages_owner_read on public.chat_messages for select
  using (exists (select 1 from public.catalogs c where c.id = chat_messages.catalog_id and c.user_id = auth.uid()));
-- (insert/update 정책 없음 → 방문자는 직접 쓸 수 없고, Edge Function만 서비스 권한으로 기록)
