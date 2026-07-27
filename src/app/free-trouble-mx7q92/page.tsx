import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { ReviewList } from "@/components/reviews/ReviewList";
import { productDescriptions } from "@/config/product-copy";
import { troubleSajuReviews } from "@/config/dummy-reviews";
import { FreeTroubleStart } from "@/components/saju/FreeTroubleStart";

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
        {/* 상단 일러스트 — 위저드와 동일 비율(88vh) + 하단에 제목 오버레이 */}
        <div
          className="w-full flex flex-col px-4"
          style={{
            minHeight: "88vh",
            backgroundImage:
              "linear-gradient(rgba(248,244,253,0) 55%, rgba(248,244,253,0.78) 76%, rgba(248,244,253,0.97) 90%), url('/images/trouble.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="mt-auto pb-2">
            <h1 className="text-2xl font-bold text-ink" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>{product.name}</h1>
            {product.description && (
              <p className="mt-2 text-sm text-body">{product.description}</p>
            )}
            <p className="mt-5 text-2xl font-medium text-ink">0원</p>
          </div>
        </div>

        <div className="px-4 pb-14">

          {/* 상품 설명 (고민 사주와 동일) */}
          {productDescriptions["trouble-saju"] && (
            <div className="mt-8 space-y-3 text-base text-ink leading-relaxed">
              {productDescriptions["trouble-saju"].map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* 이용 후기 (고민 사주와 동일) */}
          <div className="mt-10">
            <ReviewList reviews={dummyReviews} />
          </div>

          {/* 시작하기 → 단계형 위저드 */}
          <section className="mt-8">
            <FreeTroubleStart productId={product.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
