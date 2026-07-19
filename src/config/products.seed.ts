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
    price: 990,
    display_order: 10,
    is_active: true,
  },
  {
    slug: "premium-saju",
    name: "대운 해설",
    description: "물 들어올때 노젓는 방법",
    price: 990,
    display_order: 20,
    is_active: true,
  },
  {
    slug: "love-saju",
    name: "궁합 해설",
    description: "우리 사이는 몇점?",
    price: 990,
    display_order: 30,
    is_active: true,
  },
  {
    slug: "worry-saju",
    name: "무엇이든 물어보세요",
    description: "더 궁금한 점이 있다면?",
    price: 990,
    display_order: 40,
    is_active: true,
  },
  {
    slug: "realestate-saju",
    name: "부동산 투자로 재미 볼 수 있을까?",
    description: "부동산 운명 미리 보기",
    price: 990,
    display_order: 50,
    is_active: false,
  },
  {
    slug: "romance-saju",
    name: "이성이 많을 인생인가?",
    description: "내 매력은 어느 정도일까?",
    price: 990,
    display_order: 60,
    is_active: false,
  },
  {
    slug: "job-saju",
    name: "나는 어떤 직무가 맞을까?",
    description: "내 적성은 어디에 있을까?",
    price: 990,
    display_order: 70,
    is_active: false,
  },
  {
    slug: "business-saju",
    name: "나는 사업해도 되는 사주일까?",
    description: "사장 팔자인지 확인해보세요",
    price: 990,
    display_order: 80,
    is_active: false,
  },
  {
    // 공유받은 친구용 무료 MINI — 목록/일반 결제 흐름에는 노출하지 않음
    // 결과지는 원본 상품과 동일하되 일부만 공개, 990원 언락 (slug 접미사 -mini 규칙)
    slug: "today-fortune-mini",
    name: "사주 해설 MINI",
    description: "사주 해설 13가지 주제 중 6가지를 무료로",
    price: 0,
    display_order: 999,
    is_active: false,
  },
  {
    slug: "premium-saju-mini",
    name: "대운 해설 MINI",
    description: "대운 해설 미리보기를 무료로",
    price: 0,
    display_order: 999,
    is_active: false,
  },
  {
    slug: "love-saju-mini",
    name: "궁합 해설 MINI",
    description: "궁합 해설 일부를 무료로",
    price: 0,
    display_order: 999,
    is_active: false,
  },
  {
    slug: "worry-saju-mini",
    name: "무엇이든 물어보세요 MINI",
    description: "13가지 답변 중 6가지를 무료로",
    price: 0,
    display_order: 999,
    is_active: false,
  },
];
