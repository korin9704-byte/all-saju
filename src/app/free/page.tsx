import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SajuFormNoSSR as SajuForm } from "@/components/saju/SajuFormNoSSR";
import { ReviewList } from "@/components/reviews/ReviewList";
import { todayFortuneReviews } from "@/config/dummy-reviews";

export const metadata = {
  title: "사주 해설 MINI",
  description: "사주 해설 13가지 주제 중 6가지를 무료로. 생년월일만 입력하면 3분 만에 확인할 수 있어요.",
  openGraph: {
    title: "사주 해설 MINI가 도착했어요 🎁",
    description: "13가지 주제 중 6가지를 무료로 볼 수 있어요. 생년월일만 입력하면 3분이면 끝!",
  },
};

type Review = { id: string; rating: number; content: string; created_at: string };

// 사주 해설 MINI — 사주 해설(today-fortune) 상품 상세와 동일한 구성의 무료 랜딩
export default async function FreeMiniPage() {
  let isLoggedIn = false;
  let reviews: Review[] | null = null;
  let existingResultId: string | null = null; // 계정당 1회 — 이미 이용했으면 기존 결과 안내

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;

    if (user) {
      const service = createServiceClient();
      const { data: miniProduct } = await service
        .from("products")
        .select("id")
        .eq("slug", "today-fortune-mini")
        .maybeSingle();
      if (miniProduct) {
        const { data: miniOrder } = await service
          .from("orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", miniProduct.id)
          .eq("status", "paid")
          .limit(1)
          .maybeSingle();
        if (miniOrder) {
          const { data: miniResult } = await service
            .from("saju_results")
            .select("id")
            .eq("order_id", miniOrder.id)
            .maybeSingle();
          existingResultId = miniResult?.id ?? null;
        }
      }
    }

    // 후기는 원본 상품(사주 해설)의 실제 후기를 그대로 노출
    const { data: fullProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", "today-fortune")
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

  const dummyReviews: Review[] = todayFortuneReviews
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
        <h1 className="text-2xl font-bold text-ink">사주 해설 MINI</h1>
        <p className="mt-2 text-sm text-body">용하다고 소문났어요</p>
        <p className="mt-5 text-2xl font-mono font-medium text-ink">0원</p>
      </header>

      {/* 상품 소개 이미지 (사주 해설과 동일) */}
      <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
        <div className="w-full aspect-[962/663] overflow-hidden">
          <img src="/images/today-fortune.png" alt="사주 해설 MINI" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 상품 설명 (사주 해설과 동일) */}
      <div className="mb-8 space-y-3 text-base text-ink leading-relaxed">
        <p>
          타고난 성격과 기질부터 올해의 운세 흐름까지, 내 사주를 누구나 이해할 수 있는 쉬운 말로
          풀어드려요. 한자나 전문 용어 없이, 읽는 순간 &lsquo;이게 나잖아&rsquo; 싶은 느낌이 드실
          거예요. 직업·재물·연애·건강·인간관계까지 삶 전반을 한눈에 살펴보고, 유리한 시기와 조심해야
          할 시기는 언제인지 구체적으로 안내해드려요. 단순한 운세 풀이가 아닌, 내 삶의 패턴과 타고난
          강점, 반복되는 시련의 이유까지 함께 짚어드리니, 나를 더 깊이 이해하고 싶은 모든 분께 강력
          추천드려요.
        </p>
      </div>

      {/* 리뷰 섹션 */}
      {displayReviews.length > 0 && <ReviewList reviews={displayReviews} />}

      {/* 후기 → 입력폼 귀여운 구분선 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>

      <section className="mt-2">
        {existingResultId ? (
          <div className="text-center space-y-4 px-4 sm:px-0 py-6">
            <p className="text-lg font-bold text-ink">이미 무료 MINI를 이용하셨어요</p>
            <p className="text-sm text-body">무료 사주 해설 MINI는 계정당 1회 제공돼요</p>
            <Link
              href={`/results/${existingResultId}`}
              className="w-full h-14 rounded-full bg-ink text-white text-sm font-medium inline-flex items-center justify-center transition-colors hover:bg-ink/80"
            >
              내 MINI 결과 보기
            </Link>
            <Link
              href="/products/today-fortune"
              className="w-full h-14 rounded-full text-sm font-medium inline-flex items-center justify-center transition-opacity hover:opacity-90"
              style={{ background: "#ffd520", color: "#191919" }}
            >
              다른 사주가 궁금하다면 &lsquo;사주 해설&rsquo; 보기 · 990원
            </Link>
          </div>
        ) : (
          <SajuForm productId="" productSlug="today-fortune" isLoggedIn={isLoggedIn} miniMode />
        )}
      </section>
    </div>
  );
}
