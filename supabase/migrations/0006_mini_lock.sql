-- =====================================================
-- 0006: 상품별 MINI 잠금 모델
--  - saju_results.locked: MINI 결과지 잠금 (6개 공개 + 7개 잠금)
--  - orders.unlock_result_id: 990원 언락 결제 주문 → 대상 결과지 연결
--  - free-mini → today-fortune-mini('사주 해설 MINI') 개명
-- =====================================================

alter table public.saju_results add column if not exists locked boolean not null default false;

alter table public.orders add column if not exists unlock_result_id uuid references public.saju_results(id) on delete set null;

-- 기존 free-mini 상품을 사주 해설 MINI로 전환
update public.products
set slug = 'today-fortune-mini',
    name = '사주 해설 MINI',
    description = '사주 해설 13가지 주제 중 6가지를 무료로'
where slug = 'free-mini';

-- 신규 DB인 경우 대비
insert into public.products (slug, name, description, price, display_order, is_active)
values ('today-fortune-mini', '사주 해설 MINI', '사주 해설 13가지 주제 중 6가지를 무료로', 0, 999, false)
on conflict (slug) do nothing;
