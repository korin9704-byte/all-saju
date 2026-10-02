-- 결과지 공유 버튼 클릭 기록 (링크 복사 / 카카오톡 공유)
create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null,
  product_slug text not null default '',
  channel text not null check (channel in ('link', 'kakao')),
  created_at timestamptz not null default now()
);

alter table public.share_events enable row level security;
-- 쓰기·읽기 모두 서버(service role) 전용 — 클라이언트 직접 접근 없음
