-- =====================================================
-- 0007: MINI 상품 3종 추가 (대운 해설 · 궁합 해설 · 무엇이든 물어보세요)
--  - slug 접미사 -mini 규칙: 생성 시 원본 프롬프트 사용 + locked 저장 (기존 로직 재사용)
--  - 목록/일반 결제 흐름에는 노출하지 않음 (is_active=false)
-- =====================================================

insert into public.products (slug, name, description, price, display_order, is_active)
values
  ('premium-saju-mini', '대운 해설 MINI', '대운 해설 미리보기를 무료로', 0, 999, false),
  ('love-saju-mini', '궁합 해설 MINI', '궁합 해설 일부를 무료로', 0, 999, false),
  ('worry-saju-mini', '무엇이든 물어보세요 MINI', '13가지 답변 중 6가지를 무료로', 0, 999, false)
on conflict (slug) do nothing;
