-- 행운 부적 다운로드도 share_events 로 집계 — 채널 'bujeok' 허용 + 받은 부적 오행 기록
alter table public.share_events drop constraint if exists share_events_channel_check;
alter table public.share_events
  add constraint share_events_channel_check check (channel in ('link', 'kakao', 'bujeok'));

-- 부적 오행 키 (wood·fire·earth·metal·water) — 부적 다운로드일 때만 채움
alter table public.share_events add column if not exists oheng text;
