import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";
import { ReviewList } from "@/components/reviews/ReviewList";

const landingDummyReviews = [
  { id: "l1", rating: 5, content: "생각보다 훨씬 상세하게 나와서 놀랐어요. 제 성격이랑 딱 맞아서 소름 돋았어요 ㅠㅠ 주변에도 추천했어요!", created_at: "2026-05-29T00:00:00Z" },
  { id: "l2", rating: 5, content: "가격 대비 퀄리티가 너무 좋아요. 막연하게 궁금했던 부분들이 시원하게 정리됐어요. 또 살 것 같아요 😊", created_at: "2026-05-28T00:00:00Z" },
  { id: "l3", rating: 4, content: "친구 추천으로 봤는데 내용이 꽤 구체적이에요. 연애 부분이 특히 공감 갔어요. 만족합니다!", created_at: "2026-05-27T00:00:00Z" },
  { id: "l4", rating: 5, content: "올해 운세가 이렇게 잘 맞을 줄 몰랐어요. 직장 관련 내용이 특히 정확해서 깜짝 놀랐어요.", created_at: "2026-05-26T00:00:00Z" },
  { id: "l5", rating: 5, content: "처음엔 반신반의했는데 읽다 보니 너무 공감돼서 눈물이 다 났어요. 강력 추천합니다.", created_at: "2026-05-25T00:00:00Z" },
  { id: "l6", rating: 4, content: "내용이 충실하고 읽기 쉽게 잘 정리돼 있어요. 다음에 대운 해설도 볼 예정이에요!", created_at: "2026-05-24T00:00:00Z" },
  { id: "l7", rating: 5, content: "사주 봐야지 생각만 하다가 처음 봤는데 이렇게 잘 맞을 줄이야. 앞으로 매년 볼 것 같아요.", created_at: "2026-05-23T00:00:00Z" },
  { id: "l8", rating: 5, content: "제 고민이랑 딱 맞는 내용이 나와서 위로받은 느낌이에요. 좋은 서비스 감사해요 🙏", created_at: "2026-05-22T00:00:00Z" },
  { id: "l9", rating: 4, content: "전반적으로 만족해요. 다음에 궁합도 보고 싶어요.", created_at: "2026-05-21T00:00:00Z" },
  { id: "l10", rating: 5, content: "이 가격에 이 퀄리티? 진짜 말이 안 되게 잘 나와요. 친구들한테 다 공유했어요.", created_at: "2026-05-20T00:00:00Z" },
];

function LandingReviews() {
  return (
    <div className="mt-10">
      <h2 className="text-base font-semibold mb-4 text-ink">이용 후기</h2>
      <ReviewList reviews={landingDummyReviews} title="" initialCount={5} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   공통 설정
───────────────────────────────────────────────────── */
const VW = 240, VH = 168;

/* ─────────────────────────────────────────────────────
   1. 사주 해설 — 사주(四柱) 네 기둥
───────────────────────────────────────────────────── */
function ThumbSun() {
  // 네 기둥: [x, height] — 바닥 y=138 기준
  const base = 138;
  const cols = [
    { x: 61,  h: 74 },
    { x: 93,  h: 108 },
    { x: 125, h: 102 },
    { x: 157, h: 72 },
  ];
  const w = 22;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 바닥 베이스 라인 */}
      <line x1="52" y1={base} x2="188" y2={base} stroke="#C8A882" strokeWidth="1.2" opacity="0.4" />

      {cols.map((c, i) => {
        const top = base - c.h;
        return (
          <g key={i}>
            {/* 기둥 몸통 */}
            <rect x={c.x} y={top} width={w} height={c.h}
              fill="#D4845A" fillOpacity="0.10"
              stroke="#C8A882" strokeWidth="1.0" opacity="0.7" />
            {/* 기둥 상단 캡 */}
            <rect x={c.x - 3} y={top - 4} width={w + 6} height={5}
              fill="#C8A882" fillOpacity="0.30" rx="1" />
            {/* 내부 글자 라인 (3줄) */}
            <line x1={c.x + 5} y1={top + 14} x2={c.x + w - 5} y2={top + 14}
              stroke="#B8826A" strokeWidth="0.9" opacity="0.55" />
            <line x1={c.x + 5} y1={top + 24} x2={c.x + w - 5} y2={top + 24}
              stroke="#B8826A" strokeWidth="0.9" opacity="0.40" />
            {c.h > 50 && (
              <line x1={c.x + 5} y1={top + 34} x2={c.x + w - 5} y2={top + 34}
                stroke="#B8826A" strokeWidth="0.9" opacity="0.28" />
            )}
          </g>
        );
      })}

      {/* 중앙 오렌지 강조 점 (두 번째 기둥 상단) */}
      <circle cx={93 + w / 2} cy={base - 108 - 8} r="3.5" fill="#D4618A" opacity="0.80" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   2. 무엇이든 물어보세요 — 말풍선 + 물음표
───────────────────────────────────────────────────── */
function ThumbQuestion() {
  const cx = VW / 2;
  const bY = 27;
  const bH = 90;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="52" y={bY} width="136" height={bH} rx="20" fill="#C8A882" fillOpacity="0.18" />
      <path d={`M 108 ${bY+bH} Q 118 ${bY+bH+18}, 120 ${bY+bH+24} Q 122 ${bY+bH+18}, 132 ${bY+bH} Z`}
        fill="#C8A882" fillOpacity="0.18" />
      <text x={cx} y={bY + bH * 0.68} textAnchor="middle" fontSize="52"
        fill="#B8826A" fillOpacity="0.58"
        fontFamily="'Georgia', 'Times New Roman', serif" fontWeight="300">?</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   3. 연애·궁합 리포트 — 두 원 겹침 합(合) 다이어그램
───────────────────────────────────────────────────── */
function ThumbUnion() {
  const r = 46;
  const lx = 90, rx = 150, cy = VH / 2;
  const midX = (lx + rx) / 2;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx={lx} cy={cy} r={r} fill="#D4B896" fillOpacity="0.28" />
      <circle cx={rx} cy={cy} r={r} fill="#D4B896" fillOpacity="0.28" />
      <clipPath id="clipL"><circle cx={lx} cy={cy} r={r} /></clipPath>
      <circle cx={rx} cy={cy} r={r} fill="#C8A882" fillOpacity="0.22" clipPath="url(#clipL)" />
      <text x={midX} y={cy + 8} textAnchor="middle" fontSize="24" fontWeight="400" fill="#B8826A" fillOpacity="0.72" fontFamily="'Apple SD Gothic Neo', 'Noto Serif KR', serif">合</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   4. 대운 해설 — 파도 + 상승 곡선 (물 들어올 때 노 젓기)
───────────────────────────────────────────────────── */
function ThumbDaewun() {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M 24 130 C 56 112, 88 148, 120 130 C 152 112, 184 148, 216 130"
        stroke="#C8A882" strokeWidth="1.2" opacity="0.40" fill="none" strokeLinecap="round" />
      <path d="M 24 114 C 56 96, 88 132, 120 114 C 152 96, 184 132, 216 114"
        stroke="#C8A882" strokeWidth="0.9" opacity="0.28" fill="none" strokeLinecap="round" />
      <path d="M 24 146 C 56 128, 88 164, 120 146 C 152 128, 184 164, 216 146"
        stroke="#C8A882" strokeWidth="0.7" opacity="0.18" fill="none" strokeLinecap="round" />
      <path d="M 48 136 C 80 118, 108 90, 138 68 C 158 54, 174 42, 192 32"
        stroke="#D4845A" strokeWidth="2" strokeLinecap="round" opacity="0.70" fill="none" />
      <circle cx="192" cy="32" r="15" fill="#D4618A" fillOpacity="0.09" />
      <circle cx="192" cy="32" r="10" fill="#D4618A" fillOpacity="0.17" />
      <circle cx="192" cy="32" r="6.5" fill="#D4618A" />
      <circle cx="192" cy="32" r="2.5" fill="#F5C8A0" fillOpacity="0.55" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   슬러그 → 썸네일 매핑
───────────────────────────────────────────────────── */
const thumbMap: Record<string, React.ReactNode> = {
  "today-fortune": <img src="/images/today-fortune.png" alt="사주 해설" className="w-full h-full object-cover" />,
  "premium-saju":  <img src="/images/premium-saju.png" alt="대운 해설" className="w-full h-full object-cover" />,
  "love-saju":     <img src="/images/love-saju.png" alt="궁합 해설" className="w-full h-full object-cover" />,
  "worry-saju":    <img src="/images/worry-saju.png" alt="무엇이든 물어보세요" className="w-full h-full object-cover" />,
  "realestate-saju": <img src="/images/realestate-saju.png" alt="부동산 투자로 재미 볼 수 있을까?" className="w-full h-full object-cover" />,
  "romance-saju":    <img src="/images/romance-saju.png" alt="이성이 많을 인생인가?" className="w-full h-full object-cover" />,
  "job-saju":        <img src="/images/job-saju.png" alt="나는 어떤 직무가 맞을까?" className="w-full h-full object-cover" />,
  "business-saju":   <img src="/images/business-saju.png" alt="나는 사업해도 되는 사주일까?" className="w-full h-full object-cover" />,
};

/* ─────────────────────────────────────────────────────
   상품 라인업 컴포넌트
───────────────────────────────────────────────────── */
export async function ProductLineup() {
  let products: { slug: string; name: string; description: string; price: number }[] | null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("slug, name, description, price")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    products = data;
  } else {
    products = productsSeed
      .filter((p) => p.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ slug, name, description, price }) => ({ slug, name, description, price }));
  }

  if (!products || products.length === 0) {
    return (
      <section className="container py-12 text-center">
        <p className="text-sm text-body">
          상품이 아직 없어요.{" "}
          <code className="font-mono text-ink">pnpm seed:products</code> 를 실행해 주세요.
        </p>
      </section>
    );
  }

  return (
    <section id="products" className="container py-16">
      {/* 배너 이미지 */}
      <div className="mb-10">
        <img
          src="/images/hero-banner.png"
          alt="3,900원 낭점에 오신 걸 환영합니다"
          className="w-full h-auto rounded-2xl"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group block rounded-3xl border-2 border-hairline bg-canvas overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-ink"
          >
            {/* 썸네일 */}
            <div className="w-full" style={{ backgroundColor: "#F9F8F5", aspectRatio: "962/663" }}>
              {thumbMap[p.slug] ?? <ThumbSun />}
            </div>
            {/* 텍스트 */}
            <div className="p-5">
              <p className="text-base font-semibold text-ink">{p.name}</p>
              {p.description && (
                <p className="mt-1 text-sm text-body leading-snug">{p.description}</p>
              )}
              <p className="mt-4 text-lg font-mono font-medium text-ink">{formatKRW(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>


    </section>
  );
}
