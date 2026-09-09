import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { cancelTossPayment } from "@/lib/toss/cancel";
import { BUNDLE_CHILD_SUFFIX } from "@/lib/saju/generate-result";

// 관리자 환불 처리 — 토스 결제 취소 후 주문(및 번들 자식 주문)을 refunded 로 표시.
// 결과지는 삭제하지 않고 열람만 차단되므로, 실수 시 status 를 paid 로 되돌리면 복구된다.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { orderRowId } = (await req.json()) as { orderRowId?: string };
  if (!orderRowId) {
    return NextResponse.json({ error: "orderRowId 가 필요합니다." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id, order_id, status, amount, toss_payment_key")
    .eq("id", orderRowId)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (order.status !== "paid") {
    return NextResponse.json({ error: `결제완료 상태만 환불할 수 있습니다. (현재: ${order.status})` }, { status: 400 });
  }

  // 실결제 건이면 토스 취소 먼저 (0원 주문 — 이용권·번들 자식 — 은 결제 취소 없음)
  if (order.amount > 0 && order.toss_payment_key) {
    const cancel = await cancelTossPayment(order.toss_payment_key, "고객 환불 요청");
    if (!cancel.ok) {
      return NextResponse.json(
        { error: `토스 결제 취소 실패: ${cancel.error.message} (${cancel.error.code})` },
        { status: 502 },
      );
    }
  }

  const { error: updateErr } = await service
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", order.id);
  if (updateErr) {
    return NextResponse.json({ error: `주문 상태 변경 실패: ${updateErr.message}` }, { status: 500 });
  }

  // 번들이면 자식 주문(-jt, 0원)도 함께 차단
  const { data: child } = await service
    .from("orders")
    .select("id, status")
    .eq("order_id", `${order.order_id}${BUNDLE_CHILD_SUFFIX}`)
    .maybeSingle();
  if (child && child.status === "paid") {
    await service.from("orders").update({ status: "refunded" }).eq("id", child.id);
  }

  return NextResponse.json({ ok: true });
}
