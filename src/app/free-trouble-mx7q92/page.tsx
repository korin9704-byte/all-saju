import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SajuForm } from "@/components/saju/SajuForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { productDescriptions } from "@/config/product-copy";
import { troubleSajuReviews } from "@/config/dummy-reviews";

// 비공개 링크 전용 — 무료 고민 사주 (검색엔진 노출 금지)
export const metadata = {
  title: "무료 고민 사주",
  robots: { index: false, follow: false },
};

export default async function FreeTroublePage() {
  if (!isSupabaseConfigured()) notFound();

  const service = createServiceClient();
  const { data: product } = await service
    .from("products")
    .select("id, slug, name, description")
    .eq("slug", "trouble-saju-free")
    .maybeSingle();

  if (!product) notFound();

  const dummyReviews = troubleSajuReviews
    .map((r, i) => ({
      id: `d${i}`,
      rating: r.rating,
      content: r.content,
      created_at: new Date(`${r.date}T00:00:00+09:00`).toISOString(),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="container py-12 max-w-lg">
      <header className="mb-10 pb-10 border-b border-hairline">
        <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
        {product.description && (
          <p className="mt-2 text-sm text-body">{product.description}</p>
        )}
        <p className="mt-5 text-2xl font-mono font-medium text-ink">무료</p>
      </header>

      {/* 상품 소개 이미지 (고민 사주와 동일) */}
      <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
        <div className="w-full aspect-[962/663] overflow-hidden">
          <img src="/images/trouble-saju.png" alt="무료 고민 사주" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 상품 설명 (고민 사주와 동일) */}
      {productDescriptions["trouble-saju"] && (
        <div className="mb-8 space-y-3 text-base text-ink leading-relaxed">
          {productDescriptions["trouble-saju"].map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {/* 이용 후기 (고민 사주와 동일) */}
      <ReviewList reviews={dummyReviews} />

      {/* 후기 → 입력폼 구분선 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>

      <section className="mt-2">
        <SajuForm productId={product.id} productSlug="trouble-saju" isLoggedIn={false} freeTroubleMode />
      </section>
    </div>
  );
}
