import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { generateAndStoreResult, generateBundleResults, BUNDLE_SLUG } from "@/lib/saju/generate-result";

// 결제 승인 후 결과지 생성이 실패한 주문의 장애 복구 — 재생성 + 이메일 발송.
// 인생 사주 번들까지 감당하도록 confirm과 동일한 실행 한도.
export const maxDuration = 300;

export async function POST(req: Request) {
  // 프로덕션은 관리자 인증 필수, 로컬 개발 환경은 복구 작업용으로 허용
  if (process.env.NODE_ENV !== "development" && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { orderRowId } = (await req.json()) as { orderRowId?: string };
  if (!orderRowId) {
    return NextResponse.json({ error: "orderRowId 가 필요합니다." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id, order_id, status, product_id, unlock_result_id")
    .eq("id", orderRowId)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (order.status !== "paid") {
    return NextResponse.json({ error: `결제완료 상태만 재생성할 수 있습니다. (현재: ${order.status})` }, { status: 400 });
  }
  if (order.unlock_result_id) {
    return NextResponse.json({ error: "언락 주문은 재생성 대상이 아닙니다." }, { status: 400 });
  }

  // 이미 결과지가 있으면 중복 생성 방지
  const { data: existing } = await service
    .from("saju_results")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "이미 결과지가 있는 주문입니다.", resultId: existing.id }, { status: 409 });
  }

  try {
    const { data: product } = await service
      .from("products")
      .select("slug")
      .eq("id", order.product_id)
      .single();
    const { resultId } =
      product?.slug === BUNDLE_SLUG
        ? await generateBundleResults(service, order.id)
        : await generateAndStoreResult(service, order.id);
    return NextResponse.json({ ok: true, resultId });
  } catch (err) {
    return NextResponse.json(
      { error: "재생성 실패", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
