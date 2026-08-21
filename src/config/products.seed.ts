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
    name: "정통 사주",
    description: "용하다고 소문났어요.\n불만족 시 100% 환불!",
    price: 9900,
    display_order: 90,
    is_active: true,
  },
  {
    slug: "life-saju",
    name: "인생 사주",
    description: "용하다고 소문났어요.\n불만족 시 100% 환불!",
    price: 52000,
    display_order: 95,
    is_active: true,
  },
  {
    slug: "premium-saju",
    name: "대운 풀이",
    description: "물 들어올 때 노 젓는 방법",
    price: 990,
    display_order: 20,
    is_active: false,
  },
  {
    slug: "love-saju",
    name: "궁합 풀이",
    description: "우리 사이는 몇 점?",
    price: 990,
    display_order: 30,
    is_active: false,
  },
  {
    slug: "worry-saju",
    name: "무엇이든 물어보세요",
    description: "더 궁금한 점이 있다면?",
    price: 990,
    display_order: 40,
    is_active: false,
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
    description: "사장 팔자인지 확인해 보세요.",
    price: 990,
    display_order: 80,
    is_active: false,
  },
  {
    slug: "trouble-saju",
    name: "고민 사주",
    description: "오늘 해결해 드릴게요.\n불만족 시 100% 환불!",
    price: 3900,
    display_order: 10,
    is_active: true,
  },
  {
    // 비공개 링크 전용 무료 버전 (/free-trouble-mx7q92) — 목록 비노출
    slug: "trouble-saju-free",
    name: "무료 고민 사주",
    description: "오늘 해결해 드릴게요.",
    price: 0,
    display_order: 997,
    is_active: false,
  },
  {
    // 고민 사주 결제 단계 추가 상품 — 목록에는 노출하지 않음 (코드에서 slug로 제외)
    // 고민 사주 3,900 + 정통 사주 4,900(5,000원 할인) = 8,800원
    slug: "trouble-saju-bundle",
    name: "고민 사주 + 정통 사주",
    description: "고민 사주와 정통 사주를 한 번에",
    price: 8800,
    display_order: 996,
    is_active: true,
  },
  {
    // 결과지 하단 추가 고민 — 목록에는 노출하지 않음 (코드에서 slug로 제외)
    slug: "followup-question",
    name: "고민 사주",
    description: "결과지를 보고 또 다른 고민을 물어보세요.",
    price: 1950,
    display_order: 998,
    is_active: true,
  },
  {
    // 공유받은 친구용 무료 MINI — 목록/일반 결제 흐름에는 노출하지 않음
    // 결과지는 원본 상품과 동일하되 일부만 공개, 990원 언락 (slug 접미사 -mini 규칙)
    slug: "today-fortune-mini",
    name: "사주 풀이 MINI",
    description: "사주 풀이 13가지 주제 중 6가지를 무료로",
    price: 0,
    display_order: 999,
    is_active: false,
  },
  {
    slug: "premium-saju-mini",
    name: "대운 풀이 MINI",
    description: "대운 풀이 미리보기를 무료로",
    price: 0,
    display_order: 999,
    is_active: false,
  },
  {
    slug: "love-saju-mini",
    name: "궁합 풀이 MINI",
    description: "궁합 풀이 일부를 무료로",
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
