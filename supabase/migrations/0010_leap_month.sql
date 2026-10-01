-- 음력 윤달 출생 여부 (한국 음력 기준 변환에 사용)
alter table public.saju_inputs
  add column if not exists is_leap_month boolean not null default false;
