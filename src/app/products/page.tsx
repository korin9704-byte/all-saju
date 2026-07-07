import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

export const metadata = { title: "상품" };

/* ── 썸네일 SVG ── */
const VW = 240, VH = 168;

function ThumbSun() {
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
      <line x1="52" y1={base} x2="188" y2={base} stroke="#C8A882" strokeWidth="1.2" opacity="0.4" />
      {cols.map((c, i) => {
        const top = base - c.h;
        return (
          <g key={i}>
            <rect x={c.x} y={top} width={w} height={c.h}
              fill="#D4845A" fillOpacity="0.10"
              stroke="#C8A882" strokeWidth="1.0" opacity="0.7" />
            <rect x={c.x - 3} y={top - 4} width={w + 6} height={5}
              fill="#C8A882" fillOpacity="0.30" rx="1" />
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
      <circle cx={93 + w / 2} cy={base - 108 - 8} r="3.5" fill="#D4618A" opacity="0.80" />
    </svg>
  );
}

function ThumbQuestion() {
  const cx = VW / 2;
  const bY = 27, bH = 90;
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

function ThumbUnion() {
  const r = 46, lx = 90, rx = 150, cy = VH / 2, midX = (90 + 150) / 2;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx={lx} cy={cy} r={r} fill="#D4B896" fillOpacity="0.28" />
      <circle cx={rx} cy={cy} r={r} fill="#D4B896" fillOpacity="0.28" />
      <clipPath id="clipL2"><circle cx={lx} cy={cy} r={r} /></clipPath>
      <circle cx={rx} cy={cy} r={r} fill="#C8A882" fillOpacity="0.22" clipPath="url(#clipL2)" />
      <text x={midX} y={cy + 8} textAnchor="middle" fontSize="24" fontWeight="400" fill="#B8826A" fillOpacity="0.72" fontFamily="'Apple SD Gothic Neo', 'Noto Serif KR', serif">合</text>
    </svg>
  );
}

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

const thumbMap: Record<string, React.ReactNode> = {
  "today-fortune": <img src="/images/today-fortune.png" alt="사주 해설" className="w-full h-full object-cover" />,
  "premium-saju":  <img src="/images/premium-saju.png" alt="대운 해설" className="w-full h-full object-cover" />,
  "love-saju":     <img src="/images/love-saju.png" alt="궁합 해설" className="w-full h-full object-cover" />,
  "worry-saju":    <img src="/images/worry-saju.png" alt="무엇이든 물어보세요" className="w-full h-full object-cover" />,
  "realestate":    <img src="/images/realestate.png" alt="부동산 투자로 재미 볼 수 있을까?" className="w-full h-full object-cover" />,
};

/* ── 상품 페이지 ── */
export default async function ProductsPage() {
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

  return (
    <div className="container py-12">
      <header className="mb-10">
        <p className="text-xs font-mono text-mute mb-2">PRODUCTS</p>
        <h1 className="text-3xl font-semibold tracking-tight">상품</h1>
        <p className="mt-2 text-sm text-body">마음에 드는 상품을 선택해서 사주를 풀어보세요.</p>
      </header>

      {!products || products.length === 0 ? (
        <p className="text-sm text-body">상품이 없습니다.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className="group block rounded-3xl border-2 border-hairline bg-canvas overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-ink"
            >
              <div className="w-full" style={{ backgroundColor: "#F9F8F5", aspectRatio: "962/663" }}>
                {thumbMap[p.slug] ?? <ThumbSun />}
              </div>
              <div className="p-5">
                <p className="text-base font-semibold text-ink">{p.name}</p>
                <p className="mt-1.5 text-sm text-body leading-relaxed line-clamp-2">{p.description}</p>
                <p className="mt-4 text-lg font-mono font-medium text-ink">{formatKRW(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
