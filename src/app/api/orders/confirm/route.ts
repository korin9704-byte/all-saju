// 인생 사주(13장, LLM 27회 병렬)까지 감당하도록 함수 실행 한도를 늘린다
export const maxDuration = 300;

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { confirmTossPayment } from "@/lib/toss/confirm";
import { generateAndStoreResult, generateBundleResults, BUNDLE_SLUG } from "@/lib/saju/generate-result";

const bodySchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().nonnegative(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const { paymentKey, orderId, amount } = parsed.data;

  const service = createServiceClient();

  // 1. DB의 주문과 amount 일치 검증 (위변조 차단)
  const { data: order, error: orderErr } = await service
    .from("orders")
    .select("id, amount, status, product_id, user_id, guest_email, unlock_result_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
  }
  if (order.status === "paid") {
    // idempotent: 이미 결제된 주문 — 결과 페이지로 안내
    if (order.unlock_result_id) {
      return NextResponse.json({ resultId: order.unlock_result_id, alreadyPaid: true });
    }
    const { data: result } = await service
      .from("saju_results")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    return NextResponse.json({ resultId: result?.id ?? null, alreadyPaid: true });
  }
  if (order.amount !== amount) {
    return NextResponse.json({ error: "금액이 일치하지 않습니다" }, { status: 400 });
  }

  // 2. 토스 confirm
  const toss = await confirmTossPayment({ paymentKey, orderId, amount });
  if (!toss.ok) {
    await service.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: toss.error.message, code: toss.error.code }, { status: 402 });
  }
  if (toss.data.totalAmount !== amount) {
    await service.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "토스 응답 금액 불일치" }, { status: 400 });
  }

  await service
    .from("orders")
    .update({
      status: "paid",
      toss_payment_key: paymentKey,
      paid_at: toss.data.approvedAt,
    })
    .eq("id", order.id);

  // 3-a. 언락 주문: MINI 잠금 해제 (LLM 재생성 없음, 즉시 공개)
  if (order.unlock_result_id) {
    const { error: unlockErr } = await service
      .from("saju_results")
      .update({ locked: false })
      .eq("id", order.unlock_result_id);
    if (unlockErr) {
      console.error("[confirm] 잠금 해제 실패:", unlockErr);
      return NextResponse.json(
        { error: "잠금 해제 실패", hint: "결제는 정상 승인되었습니다. /admin/orders 에서 확인하세요." },
        { status: 500 },
      );
    }
    return NextResponse.json({ resultId: order.unlock_result_id });
  }

  // 3-b. 사주 생성 (번들이면 고민 사주 + 정통 사주 결과지를 병렬 생성)
  // 일시적 LLM 오류 대비 1회 자동 재시도 — 그래도 실패하면 /admin/orders 재생성 버튼으로 복구
  const { data: paidProduct } = await service
    .from("products")
    .select("slug")
    .eq("id", order.product_id)
    .single();

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { resultId } =
        paidProduct?.slug === BUNDLE_SLUG
          ? await generateBundleResults(service, order.id)
          : await generateAndStoreResult(service, order.id);
      return NextResponse.json({ resultId });
    } catch (err) {
      lastErr = err;
      console.error(`[confirm] 결과지 생성 실패 (시도 ${attempt}/2):`, err);
      // 부분 성공(결과 저장 후 후처리 실패) 시 재시도로 중복 생성하지 않도록 방어
      const { data: partial } = await service
        .from("saju_results")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();
      if (partial) return NextResponse.json({ resultId: partial.id });
      if (attempt < 2) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return NextResponse.json(
    {
      error: "사주 해석 생성 실패",
      detail: lastErr instanceof Error ? lastErr.message : String(lastErr),
      hint: "결제는 정상 승인되었습니다. /admin/orders 에서 재생성 버튼으로 복구하세요.",
    },
    { status: 500 },
  );
}
