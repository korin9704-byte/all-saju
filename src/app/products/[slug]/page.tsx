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
import {
  worrySajuReviews,
  todayFortuneReviews,
  premiumSajuReviews,
  loveSajuReviews,
  realEstateReviews,
  romanceSajuReviews,
  jobSajuReviews,
  businessSajuReviews,
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
