// 인생 사주(13장, LLM 27회 병렬)까지 감당하도록 함수 실행 한도를 늘린다
export const maxDuration = 300;

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateAndStoreResult, generateBundleResults, BUNDLE_SLUG } from "@/lib/saju/generate-result";

// 개발 전용 — 결제 완료됐지만 결과지 생성에 실패한 주문을 재생성 (장애 복구용)
// POST { orderId: "ord_..." }  (orders.order_id 텍스트 ID)
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "개발 환경에서만 사용 가능합니다." }, { status: 403 });
  }

  const { orderId } = await request.json();
  const service = createServiceClient();

  const { data: order } = await service
    .from("orders")
    .select("id, order_id, status, product_id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "주문 없음" }, { status: 404 });
  if (order.status !== "paid") return NextResponse.json({ error: `상태가 paid 아님: ${order.status}` }, { status: 400 });

  const { data: existing } = await service
    .from("saju_results")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ resultId: existing.id, alreadyExists: true });

  const { data: product } = await service
    .from("products")
    .select("slug")
    .eq("id", order.product_id)
    .single();

  try {
    const result =
      product?.slug === BUNDLE_SLUG
        ? await generateBundleResults(service, order.id)
        : await generateAndStoreResult(service, order.id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
