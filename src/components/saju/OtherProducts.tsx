import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";

const THUMB_SRC: Record<string, string> = {
  "today-fortune":   "/images/today-fortune.png",
  "premium-saju":    "/images/premium-saju.png",
  "love-saju":       "/images/love-saju.png",
  "worry-saju":      "/images/worry-saju.png",
  "realestate-saju": "/images/realestate-saju.png",
  "romance-saju":    "/images/romance-saju.png",
  "job-saju":        "/images/job-saju.png",
  "business-saju":   "/images/business-saju.png",
};

/** 결과지 하단 — 다른 상품 진열 섹션 */
export async function OtherProducts({ currentSlug }: { currentSlug?: string | null }) {
  const service = createServiceClient();
  const { data: products } = await service
    .from("products")
    .select("slug, name, description, price")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const others = (products ?? []).filter((p) => p.slug !== currentSlug);
  if (others.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>
      <p className="mt-10 mb-6 text-center text-xl font-bold text-ink">
        냥이가 답을 찾아드릴게요!
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 px-4">
        {others.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group block rounded-3xl border-2 border-hairline bg-canvas overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-ink"
          >
            <div className="w-full" style={{ backgroundColor: "#F9F8F5", aspectRatio: "962/663" }}>
              {THUMB_SRC[p.slug] && (
                <img src={THUMB_SRC[p.slug]} alt={p.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-5">
              <p className="text-base font-semibold text-ink">{p.name}</p>
              <p className="mt-1.5 text-sm text-body leading-relaxed line-clamp-2">{p.description}</p>
              <p className="mt-4 text-lg font-mono font-medium text-ink">{formatKRW(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
