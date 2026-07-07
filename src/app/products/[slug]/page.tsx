import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SajuFormNoSSR as SajuForm } from "@/components/saju/SajuFormNoSSR";
import { ReviewList } from "@/components/reviews/ReviewList";
import { formatKRW } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";
import {
  worrySajuReviews,
  todayFortuneReviews,
  premiumSajuReviews,
  loveSajuReviews,
  type DummyReview,
} from "@/config/dummy-reviews";

type Product = { id: string; slug: string; name: string; description: string; price: number };
type Review = { id: string; rating: number; content: string; created_at: string };

const dummyReviewsBySlug: Record<string, DummyReview[]> = {
  "worry-saju":    worrySajuReviews,
  "today-fortune": todayFortuneReviews,
  "premium-saju":  premiumSajuReviews,
  "love-saju":     loveSajuReviews,
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product | null;
  let reviews: Review[] | null = null;
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, description, price")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    product = data;

    if (product) {
      const { data: r } = await supabase
        .from("reviews")
        .select("id, rating, content, created_at")
        .eq("product_id", product.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(5);
      reviews = r;
    }
    user = await getCurrentUser();
  } else {
    const seed = productsSeed.find((p) => p.slug === slug && p.is_active);
    product = seed ? { id: seed.slug, ...seed } : null;
  }

  if (!product) notFound();

  // 상품별 더미 리뷰 (실제 리뷰가 없을 때 표시)
  const rawDummy = dummyReviewsBySlug[product.slug] ?? [];
  const dummyReviews: Review[] = rawDummy
    .map((r, i) => ({
      id: `d${i}`,
      rating: r.rating,
      content: r.content,
      created_at: new Date(`${r.date}T00:00:00+09:00`).toISOString(),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const displayReviews = (reviews && reviews.length > 0) ? reviews : dummyReviews;

  // 상품별 하이라이트 색상 (이미지 색상에 맞춤)
  const hlColors: Record<string, string> = {
    "today-fortune": "#ddd6fe",  // 보라
    "premium-saju":  "#bfdbfe",  // 하늘파랑
    "love-saju":     "#fbcfe8",  // 핑크
    "worry-saju":    "#fed7aa",  // 주황
  };
  const hlColor = hlColors[product.slug] ?? "#fde68a";
  const hl = (text: string) => (
    <span className="font-semibold" style={{ background: `linear-gradient(transparent 55%, ${hlColor} 55%)` }}>{text}</span>
  );

  const productDescriptions: Record<string, React.ReactNode[]> = {
    "today-fortune": [
      <>타고난 성격과 기질부터 올해의 운세 흐름까지, 내 사주를 누구나 이해할 수 있는 쉬운 말로 풀어드려요. 한자나 전문 용어 없이, 읽는 순간 '이게 나잖아' 싶은 느낌이 드실 거예요. 직업·재물·연애·건강·인간관계까지 삶 전반을 한눈에 살펴보고, 유리한 시기와 조심해야 할 시기는 언제인지 구체적으로 안내해드려요. 단순한 운세 풀이가 아닌, 내 삶의 패턴과 타고난 강점, 반복되는 시련의 이유까지 함께 짚어드리니, 나를 더 깊이 이해하고 싶은 모든 분께 강력 추천드려요.</>,
    ],
    "premium-saju": [
      <>다가올 10년 대운의 흐름을 연도별로 상세히 분석해드려요. 인생에는 치고 나가야 할 때와 조용히 준비해야 할 때가 분명히 따로 있어요. 많은 사람들이 이걸 모르고 쉬어야 할 때 무리하다가 기회를 놓쳐요. 에너지를 써야 할 시기와 기다려야 할 시기를 현명하게 선택하고, 앞으로 어떤 파도가 오는지 미리 알고 준비하면 같은 상황에서도 결과가 달라질 수 있어요. 이직·창업·결혼·투자 등 중요한 결정을 앞두고 있다면 꼭 확인해보세요.</>,
    ],
    "love-saju": [
      <>두 사람의 사주를 나란히 놓고 궁합 점수와 함께 감정·소통·갈등·가치관·결혼 궁합까지 13가지 주제로 꼼꼼히 분석해요. 단순한 점수가 아닌, 두 사람 사이에서 실제로 일어나는 일들을 사주로 풀어드려요. 왜 자꾸 같은 패턴의 갈등이 반복되는지, 잘 맞는 부분과 보완이 필요한 부분은 어디인지 짚고, 함께 더 행복해질 수 있는 방향까지 안내해드릴게요. 연인·부부·짝사랑·친구·가족 모두 가능해요.</>,
    ],
    "worry-saju": [
      <>연애·직장·돈·관계 등 어떤 질문이든 내 사주와 연결해 구체적으로 답해드려요. 깊은 고민일 수도, 문득 떠오른 궁금증일 수도 있어요. 거창하지 않아도 괜찮아요. 왜 이런 상황이 생겼는지 맥락부터 짚고, 지금 내가 어떤 시기에 있는지 이해하면 같은 상황도 다르게 보여요. 내 사주에 맞는 맞춤형 해설로 방향을 잡아드릴게요. 질문을 구체적으로 적어주실수록 더 정확한 답변을 드릴 수 있어요.</>,
    ],
  };

  return (
    <div className="container py-12 max-w-lg">
      <header className="mb-10 pb-10 border-b border-hairline">
        <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
        {product.description && (
          <p className="mt-2 text-sm text-body">{product.description}</p>
        )}
        <p className="mt-5 text-2xl font-mono font-medium text-ink">{formatKRW(product.price)}</p>
      </header>

      {/* 상품 소개 — today-fortune */}
      {product.slug === "today-fortune" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/today-fortune.png" alt="사주 해설" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — premium-saju */}
      {product.slug === "premium-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/premium-saju.png" alt="대운 해설" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — love-saju */}
      {product.slug === "love-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/love-saju.png" alt="궁합 해설" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — worry-saju */}
      {product.slug === "worry-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/worry-saju.png" alt="무엇이든 물어보세요" className="w-full h-full object-cover" />
          </div>
        </div>
      )}



      {/* 상품 설명 */}
      {productDescriptions[product.slug] && (
        <div className="mb-8 space-y-3 text-base text-ink leading-relaxed">
          {productDescriptions[product.slug].map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {/* 리뷰 섹션 */}
      {displayReviews.length > 0 && (
        <ReviewList reviews={displayReviews} />
      )}

      {/* 후기 → 입력폼 귀여운 구분선 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>

      <section className="mt-2">
        <SajuForm productId={product.id} productSlug={product.slug} isLoggedIn={!!user} />
      </section>
    </div>
  );
}
