-- 환불 상태 추가 — 관리자 환불 처리 시 주문을 refunded 로 표시하고 결과지 열람을 차단한다
alter type public.order_status add value if not exists 'refunded';
