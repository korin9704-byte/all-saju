import { createClient } from "@/lib/supabase/server";
import { ReviewList } from "@/components/reviews/ReviewList";
import { isSupabaseConfigured } from "@/lib/env";
import { troubleSajuReviews } from "@/config/dummy-reviews";

export const metadata = { title: "리뷰" };

type Review = { id: string; rating: number; content: string; created_at: string };

/** 전 상품 리뷰 모음 — 현재 판매 상품이 고민 사주 하나라 고민 사주 리뷰만 표시 */
export default async function ReviewsPage() {
  let reviews: Review[] | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("slug", "trouble-saju")
      .maybeSingle();

    if (product) {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, content, created_at")
        .eq("product_id", product.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      reviews = data;
    }
  }

  const dummyReviews: Review[] = troubleSajuReviews
    .map((r, i) => ({
      id: `d${i}`,
      rating: r.rating,
      content: r.content,
      created_at: new Date(`${r.date}T00:00:00+09:00`).toISOString(),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const displayReviews = reviews && reviews.length > 0 ? reviews : dummyReviews;

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">리뷰</h1>
      <ReviewList reviews={displayReviews} title="" initialCount={10} />
    </div>
  );
}
