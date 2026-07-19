// =====================================================
// MINI(무료 티저) 상품 설정
// slug 접미사 -mini 규칙: `${slug}-mini` 상품이 원본과 동일한 결과지를
// 생성하되 잠금 상태로 저장되고, 앞 visible개 섹션만 공개된다.
// =====================================================

export const MINI_PRODUCTS = {
  "today-fortune": { name: "사주 해설", visible: 6 },
  "premium-saju": { name: "대운 해설", visible: 2 },
  "love-saju": { name: "궁합 해설", visible: 6 },
  "worry-saju": { name: "무엇이든 물어보세요", visible: 6 },
} as const;

export type MiniBaseSlug = keyof typeof MINI_PRODUCTS;

export function isMiniBaseSlug(slug: string): slug is MiniBaseSlug {
  return slug in MINI_PRODUCTS;
}
