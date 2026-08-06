import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SajuFormNoSSR as SajuForm } from "@/components/saju/SajuFormNoSSR";
import { ReviewList } from "@/components/reviews/ReviewList";
import { formatKRW } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";
import { productDescriptions } from "@/config/product-copy";
import { FreeTroubleStart } from "@/components/saju/FreeTroubleStart";
import {
  worrySajuReviews,
  todayFortuneReviews,
  premiumSajuReviews,
  loveSajuReviews,
  realEstateReviews,
  romanceSajuReviews,
  jobSajuReviews,
  businessSajuReviews,
  troubleSajuReviews,
  type DummyReview,
} from "@/config/dummy-reviews";

type Product = { id: string; slug: string; name: string; description: string; price: number };
type Review = { id: string; rating: number; content: string; created_at: string };

const dummyReviewsBySlug: Record<string, DummyReview[]> = {
  "worry-saju":      worrySajuReviews,
  "today-fortune":   todayFortuneReviews,
  "premium-saju":    premiumSajuReviews,
  "love-saju":       loveSajuReviews,
  "realestate-saju": realEstateReviews,
  "romance-saju":    romanceSajuReviews,
  "job-saju":        jobSajuReviews,
  "business-saju":   businessSajuReviews,
  "trouble-saju":    troubleSajuReviews,
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

  /* ── 위저드형 상품: 무료 고민 사주와 동일한 디자인 (히어로 + 설명 + 리뷰 + 시작하기 위저드)
        today-fortune은 고민 입력 단계 없이 진행 ── */
  const wizardHeroes: Record<string, string> = {
    "trouble-saju": "/images/trouble.webp",
    "today-fortune": "/images/today.webp",
  };
  const wizardHero = wizardHeroes[product.slug];
  if (wizardHero) {
    return (
      <div className="min-h-screen flex justify-center ft-theme" style={{ backgroundColor: "#F8F4FD" }}>
        <style>{`
          .ft-theme .text-ink { color: #4A3A72; }
          .ft-theme .text-body { color: #7A6B9E; }
          .ft-theme .text-charcoal { color: #4A3A72; }
          .ft-theme .text-mute { color: #9C8FBF; }
          .ft-theme span[style*="rgb(103, 32, 145)"], .ft-theme span[style*="#672091"] { color: #C95FC0 !important; }
          .ft-theme .text-\\[\\#f59e0b\\] { color: #EFBE68; }
          .ft-theme .text-\\[\\#e0e0e0\\] { color: #EFE7FA; }
          .ft-theme li[class*="f5f5f5"] { background: #F3EDFB; border: 1px solid #E7DDF8; }
          .ft-theme button[class*="f5f5f5"] { background: #F3EDFB; border: 1px solid #E7DDF8; }
          .ft-theme button[class*="f5f5f5"]:hover { background: #E7DDF8; }
        `}</style>
        <div className="w-full max-w-lg">
          {/* 상단 일러스트 — 하단에 제목 오버레이 */}
          <div
            className="w-full flex flex-col px-4"
            style={{
              minHeight: "88vh",
              backgroundImage:
                `linear-gradient(rgba(248,244,253,0) 55%, rgba(248,244,253,0.78) 76%, rgba(248,244,253,0.97) 90%), url('${wizardHero}')`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          >
            <div className="mt-auto pb-2">
              <h1 className="text-2xl font-bold text-ink" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>{product.name}</h1>
              {product.description && (
                <p className="mt-2 text-sm text-body">
                  {product.description.split("\n").map((line, i) => (
                    <span key={i} className={`block ${line.includes("100% 환불") ? "text-[#C95FC0]" : ""}`}>{line}</span>
                  ))}
                </p>
              )}
              <p className="mt-5 text-2xl font-medium text-ink">{formatKRW(product.price)}</p>
            </div>
          </div>

          <div className="px-4 pb-14">
            {/* 상품 설명 */}
            {productDescriptions[product.slug] && (
              <div className="mt-8 space-y-3 text-base text-ink leading-relaxed">
                {productDescriptions[product.slug].map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {/* 리뷰 */}
            <div className="mt-10">
              <ReviewList reviews={displayReviews} />
            </div>

            {/* 시작하기 → 단계형 위저드 (결제) — 고민 사주만 고민 입력 단계 포함 */}
            <section className="mt-8">
              <FreeTroubleStart productId={product.id} mode="paid" askConcern={product.slug === "trouble-saju"} />
            </section>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container py-12 max-w-lg">
      <header className="mb-10 pb-10 border-b border-hairline">
        <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
        {product.description && (
          <p className="mt-2 text-sm text-body">{product.description}</p>
        )}
        <p className="mt-5 text-2xl font-medium text-ink">{formatKRW(product.price)}</p>
      </header>

      {/* 상품 소개 — today-fortune */}
      {product.slug === "today-fortune" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/today-fortune.png" alt="사주 풀이" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — premium-saju */}
      {product.slug === "premium-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/premium-saju.png" alt="대운 풀이" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — love-saju */}
      {product.slug === "love-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/love-saju.png" alt="궁합 풀이" className="w-full h-full object-cover" />
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

      {/* 상품 소개 — realestate-saju */}
      {product.slug === "realestate-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/realestate-saju.png" alt="부동산 투자로 재미 볼 수 있을까?" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — romance-saju */}
      {product.slug === "romance-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/romance-saju.png" alt="이성이 많을 인생인가?" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — job-saju */}
      {product.slug === "job-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/job-saju.png" alt="나는 어떤 직무가 맞을까?" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — business-saju */}
      {product.slug === "business-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/business-saju.png" alt="나는 사업해도 되는 사주일까?" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — trouble-saju */}
      {product.slug === "trouble-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/trouble-saju.png" alt="고민 사주" className="w-full h-full object-cover" />
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
