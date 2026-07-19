import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SajuFormNoSSR as SajuForm } from "@/components/saju/SajuFormNoSSR";
import { ReviewList } from "@/components/reviews/ReviewList";
import { productDescriptions } from "@/config/product-copy";
import { productsSeed } from "@/config/products.seed";
import { MINI_PRODUCTS, isMiniBaseSlug } from "@/lib/mini";
import {
  worrySajuReviews,
  todayFortuneReviews,
  premiumSajuReviews,
  loveSajuReviews,
  type DummyReview,
} from "@/config/dummy-reviews";

type Review = { id: string; rating: number; content: string; created_at: string };

const dummyReviewsBySlug: Record<string, DummyReview[]> = {
  "today-fortune": todayFortuneReviews,
  "premium-saju": premiumSajuReviews,
  "love-saju": loveSajuReviews,
  "worry-saju": worrySajuReviews,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isMiniBaseSlug(slug)) return { title: "MINI" };
  const name = MINI_PRODUCTS[slug].name;
  return {
    title: `${name} MINI`,
    description: "냥이가 답을 찾아드릴게요!",
    openGraph: {
      title: `‘무료 ${name} MINI’ 선물 도착~`,
      description: "냥이가 답을 찾아드릴게요!",
    },
  };
}

// 상품별 MINI — 원본 상품 상세와 동일한 구성의 무료 랜딩 (slug = 원본 상품 슬러그)
export default async function FreeMiniPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isMiniBaseSlug(slug)) notFound();

  const name = MINI_PRODUCTS[slug].name;
  const tagline = productsSeed.find((p) => p.slug === slug)?.description ?? "";

  let isLoggedIn = false;
  let reviews: Review[] | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;

    // 후기는 원본 상품의 실제 후기를 그대로 노출
    const { data: fullProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (fullProduct) {
      const { data: r } = await supabase
        .from("reviews")
        .select("id, rating, content, created_at")
        .eq("product_id", fullProduct.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(5);
      reviews = r;
    }
  }

  const dummyReviews: Review[] = (dummyReviewsBySlug[slug] ?? [])
    .map((r, i) => ({
      id: `d${i}`,
      rating: r.rating,
      content: r.content,
      created_at: new Date(`${r.date}T00:00:00+09:00`).toISOString(),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const displayReviews = (reviews && reviews.length > 0) ? reviews : dummyReviews;

  return (
    <div className="container py-12 max-w-lg">
      <header className="mb-10 pb-10 border-b border-hairline">
        <h1 className="text-2xl font-bold text-ink">{name} MINI</h1>
        {tagline && <p className="mt-2 text-sm text-body">{tagline}</p>}
        <p className="mt-5 text-2xl font-mono font-medium text-ink">0원</p>
      </header>

      {/* 상품 소개 이미지 (원본 상품과 동일) */}
      <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
        <div className="w-full aspect-[962/663] overflow-hidden">
          <img src={`/images/${slug}.png`} alt={`${name} MINI`} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 상품 설명 (원본 상품과 동일) */}
      {productDescriptions[slug] && (
        <div className="mb-8 space-y-3 text-base text-ink leading-relaxed">
          {productDescriptions[slug].map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {/* 리뷰 섹션 */}
      {displayReviews.length > 0 && <ReviewList reviews={displayReviews} />}

      {/* 후기 → 입력폼 귀여운 구분선 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>

      <section className="mt-2">
        <SajuForm productId="" productSlug={slug} isLoggedIn={isLoggedIn} miniMode />
      </section>
    </div>
  );
}
