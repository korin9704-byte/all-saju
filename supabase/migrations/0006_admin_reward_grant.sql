-- =====================================================
-- 0006 — 무료권 관리자 수동 지급 허용
-- =====================================================
-- referral_rewards 는 "친구 1명 완료 = 무료권 1개" 구조라 referred_user_id 가
-- not null + unique 였다. 관리자가 특정 계정에 무료권을 직접 지급할 수 있도록
-- referred_user_id 를 nullable 로 완화한다 (지급 행은 null).
-- 친구 추천 적립의 "같은 친구는 평생 1회" 규칙은 부분 유니크 인덱스로 그대로 유지.
-- 소비/조회 로직(orders/redeem, referral/me)은 referrer_id + used_at 만 보므로 영향 없음.
-- ※ 2026-09-01 프로덕션 DB에 적용 완료 (Studio SQL Editor).

alter table public.referral_rewards alter column referred_user_id drop not null;

alter table public.referral_rewards drop constraint if exists referral_rewards_referred_user_id_key;

create unique index if not exists referral_rewards_referred_user_uniq
  on public.referral_rewards(referred_user_id)
  where referred_user_id is not null;
