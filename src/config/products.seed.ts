// =====================================================
// 상품 시드 (scripts/seed-products.ts 에서 사용)
// =====================================================
// 가격대만 다른 단순 라인업. 수강생은 자유롭게 추가/수정 후
// pnpm seed:products 로 DB에 반영합니다.

export type ProductSeed = {
  slug: string;
  name: string;
  description: string;
  price: number;
  display_order: number;
  is_active: boolean;
};

export const productsSeed: ProductSeed[] = [
  {
    slug: "today-fortune",
    name: "사주 해설",
    description: "용하다고 소문났어요",
    price: 3900,
    display_order: 10,
    is_active: true,
  },
  {
    slug: "premium-saju",
    name: "대운 해설",
    description: "물 들어올때 노젓는 방법",
    price: 3900,
    display_order: 20,
    is_active: true,
  },
  {
    slug: "love-saju",
    name: "궁합 해설",
    description: "우리 사이는 몇점?",
    price: 3900,
    display_order: 30,
    is_active: true,
  },
  {
    slug: "worry-saju",
    name: "무엇이든 물어보세요",
    description: "더 궁금한 점이 있다면?",
    price: 3900,
    display_order: 40,
    is_active: true,
  },
  {
    slug: "realestate-saju",
    name: "부동산 투자로 재미 볼 수 있을까?",
    description: "부동산 운명 미리 보기",
    price: 3900,
    display_order: 50,
    is_active: true,
  },
];
