-- =====================================================
-- 0008: 관리자 무료 이용권 지급 지원
--  - referred_user_id NULL 허용 (NULL은 unique 제약에 안 걸려 무제한 지급 가능)
--  - 기존 관리자 지급 행(연결된 미니 주문 없음)의 친구 연결 해제
--    → 소모됐던 계정들이 다시 정상적으로 적립 트리거가 될 수 있음
-- =====================================================

alter table public.referral_rewards alter column referred_user_id drop not null;

-- 관리자 지급 행 = mini_order_id 가 없는 행 (실제 친구 적립은 항상 미니 주문과 연결됨)
update public.referral_rewards
set referred_user_id = null
where mini_order_id is null
  and referred_user_id is not null;
