-- =====================================================
-- 명운원 — 전체 마이그레이션 + 시드 (한 번에 실행)
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- =====================================================

-- 0001_init.sql
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  price integer not null check (price >= 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_active_order_idx on public.products(is_active, display_order);

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  product_id uuid not null references public.products(id),
  amount integer not null check (amount >= 0),
  status public.order_status not null default 'pending',
  toss_payment_key text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint orders_user_or_guest check (user_id is not null or guest_email is not null)
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_guest_email_idx on public.orders(guest_email);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

do $$ begin
  create type public.calendar_kind as enum ('solar', 'lunar');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.gender_kind as enum ('male', 'female');
exception when duplicate_object then null;
end $$;

create table if not exists public.saju_inputs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  name text,
  birth_date date not null,
  birth_time time,
  time_unknown boolean not null default false,
  gender public.gender_kind not null,
  calendar public.calendar_kind not null default 'solar',
  concerns text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.saju_results (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  myeongsik jsonb not null,
  interpretation_md text not null,
  llm_provider text not null,
  llm_model text not null,
  created_at timestamptz not null default now()
);

create index if not exists saju_results_order_idx on public.saju_results(order_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  rating smallint not null check (rating between 1 and 5),
  content text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews(product_id, is_public);

-- 0002_rls.sql
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.saju_inputs enable row level security;
alter table public.saju_results enable row level security;
alter table public.reviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'profiles self select') then
    create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'profiles self update') then
    create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'products public read') then
    create policy "products public read" on public.products for select using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'orders self select') then
    create policy "orders self select" on public.orders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'saju_inputs via own order') then
    create policy "saju_inputs via own order" on public.saju_inputs for select using (
      exists (select 1 from public.orders o where o.id = saju_inputs.order_id and o.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'saju_results via own order') then
    create policy "saju_results via own order" on public.saju_results for select using (
      exists (select 1 from public.orders o where o.id = saju_results.order_id and o.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where policyname = 'reviews public read') then
    create policy "reviews public read" on public.reviews for select using (is_public = true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'reviews self insert') then
    create policy "reviews self insert" on public.reviews for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'reviews self update') then
    create policy "reviews self update" on public.reviews for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'reviews self delete') then
    create policy "reviews self delete" on public.reviews for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 0004_api_usage.sql
create table if not exists public.saju_api_calls (
  id uuid primary key default gen_random_uuid(),
  called_at timestamptz not null default now(),
  success boolean not null,
  source text
);

create index if not exists saju_api_calls_called_at_idx on public.saju_api_calls (called_at desc);
create index if not exists saju_api_calls_source_idx on public.saju_api_calls (source);

-- 0003_seed_products.sql (상품 데이터)
insert into public.products (slug, name, description, price, display_order, is_active)
values
  ('today-fortune', '오늘의 운세 한 줄', '아침에 가볍게 보는 오늘 하루 흐름 한 문장', 4900, 10, true),
  ('basic-saju', '기본 사주 풀이', '사주 4기둥 기반 종합 성향 / 운의 흐름 리포트', 9900, 20, true),
  ('love-saju', '연애·궁합 리포트', '내 연애 패턴과 잘 맞는 사람 유형 분석', 19900, 30, true),
  ('premium-saju', '프리미엄 종합 풀이', '대운 / 세운 / 직업운 / 재물운 / 건강운 통합 리포트', 49900, 40, true)
on conflict (slug) do nothing;

-- 0005_referral_kakao.sql (바이럴 리퍼럴 + 전 상품 990원)
update public.products set price = 990 where slug <> 'free-mini';

insert into public.products (slug, name, description, price, display_order, is_active)
values ('free-mini', '무료 미니 사주', '생년월일로 3분 만에 보는 무료 미니 사주', 0, 999, false)
on conflict (slug) do nothing;

alter table public.profiles add column if not exists referral_code text;
create unique index if not exists profiles_referral_code_idx on public.profiles(referral_code) where referral_code is not null;

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
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
