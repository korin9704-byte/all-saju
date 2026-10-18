-- 주문 유입 경로 — 마지막으로 클릭한 광고/유입처 기준 (meta·tiktok·naver·google·kakao·instagram·other·direct)
alter table public.orders add column if not exists source text;

-- 유입 상세 — utm_source/medium/campaign/content, 클릭 ID 종류(fbclid·ttclid·gclid), 첫 진입 경로, referrer, 기록 시각
alter table public.orders add column if not exists attribution jsonb;

create index if not exists orders_source_created_at_idx on public.orders (source, created_at);
