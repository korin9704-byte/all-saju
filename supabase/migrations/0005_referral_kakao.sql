-- =====================================================
-- 0005: 바이럴 리퍼럴 시스템 + 전 상품 990원
--  - 전 상품 가격 990원 일괄 변경
--  - 무료 미니 사주 상품 추가 (목록 비노출: is_active=false)
--  - profiles.referral_code (공유 링크용 코드)
--  - referral_rewards (무료권: 친구 1명 완료 = 1개, 친구당 평생 1회, 누적 상한 4는 앱에서 검증)
-- =====================================================

-- 전 상품 990원
update public.products set price = 990 where slug <> 'free-mini';

-- 무료 미니 사주 (공유받은 친구용 — 상품 목록/일반 결제 흐름에는 노출하지 않음)
insert into public.products (slug, name, description, price, display_order, is_active)
values ('free-mini', '무료 미니 사주', '생년월일로 3분 만에 보는 무료 미니 사주', 0, 999, false)
on conflict (slug) do nothing;

-- 추천 코드
alter table public.profiles add column if not exists referral_code text;
create unique index if not exists profiles_referral_code_idx on public.profiles(referral_code) where referral_code is not null;

-- 무료권
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  -- 같은 친구는 평생 1회만 적립 트리거가 됨
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  mini_order_id uuid references public.orders(id) on delete set null,
  used_order_id uuid references public.orders(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint referral_no_self check (referrer_id <> referred_user_id)
);

create index if not exists referral_rewards_referrer_idx on public.referral_rewards(referrer_id);

alter table public.referral_rewards enable row level security;

drop policy if exists "referral_rewards_select_own" on public.referral_rewards;
create policy "referral_rewards_select_own" on public.referral_rewards
  for select using (auth.uid() = referrer_id);
