import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

// 결과지 공유 버튼·부적 다운로드 클릭 기록 — 실패해도 사용자 흐름에는 영향 없음 (fire-and-forget)
const bodySchema = z.object({
  resultId: z.string().uuid(),
  channel: z.enum(["link", "kakao", "bujeok"]),
  oheng: z.enum(["wood", "fire", "earth", "metal", "water"]).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const { resultId, channel, oheng } = parsed.data;

  const service = createServiceClient();
  try {
    // 결과지 → 주문 → 상품 슬러그 (분석용) — 없는 결과지는 기록하지 않음
    const { data: result } = await service
      .from("saju_results")
      .select("id, order_id")
      .eq("id", resultId)
      .maybeSingle();
    if (!result) return NextResponse.json({ ok: false }, { status: 404 });

    let productSlug = "";
    const { data: order } = await service
      .from("orders")
      .select("product_id")
      .eq("id", result.order_id)
      .maybeSingle();
    if (order) {
      const { data: product } = await service
        .from("products")
        .select("slug")
        .eq("id", order.product_id)
        .maybeSingle();
      productSlug = product?.slug ?? "";
    }

    const { error } = await service.from("share_events").insert({
      result_id: resultId,
      product_slug: productSlug,
      channel,
      ...(channel === "bujeok" && oheng ? { oheng } : {}),
    });
    if (error) console.error("[share-events] 기록 실패:", error.message);
  } catch (err) {
    console.error("[share-events] 기록 중 오류:", err);
  }
  // 집계 실패가 공유 UX를 막으면 안 되므로 항상 ok
  return NextResponse.json({ ok: true });
}
