import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateAndStoreResult } from "@/lib/saju/generate-result";

// 무료권으로 상품 열람: 0원 주문 생성 + 무료권 원자적 차감 + 결과 생성
const bodySchema = z.object({
  productId: z.string().uuid(),
  name: z.string().max(50).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  timeUnknown: z.boolean(),
  gender: z.enum(["male", "female"]),
  calendar: z.enum(["solar", "lunar"]),
  concerns: z.array(z.string().max(350)).max(20),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: product } = await service
    .from("products")
    .select("id, slug, price, is_active")
    .eq("id", body.productId)
    .maybeSingle();

  if (!product || !product.is_active || product.slug === "free-mini") {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다" }, { status: 404 });
  }

  // 사용 가능한 무료권 조회
  const { data: reward } = await service
    .from("referral_rewards")
    .select("id")
    .eq("referrer_id", user.id)
    .is("used_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!reward) {
    return NextResponse.json({ error: "사용 가능한 무료권이 없어요" }, { status: 402 });
  }

  // 0원 주문 생성
  const orderId = `rdm_${nanoid(20)}`;
  const { data: order, error: orderErr } = await service
    .from("orders")
    .insert({
      order_id: orderId,
      user_id: user.id,
      guest_email: user.email ?? null,
      product_id: product.id,
      amount: 0,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[redeem] 주문 생성 실패:", orderErr);
    return NextResponse.json({ error: "주문 생성 실패" }, { status: 500 });
  }

  // 무료권 원자적 차감 (used_at is null 조건 → 동시 요청 시 한 쪽만 성공)
  const { data: consumed } = await service
    .from("referral_rewards")
    .update({ used_at: new Date().toISOString(), used_order_id: order.id })
    .eq("id", reward.id)
    .is("used_at", null)
    .select("id");

  if (!consumed || consumed.length === 0) {
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "무료권이 이미 사용됐어요. 다시 시도해 주세요" }, { status: 409 });
  }

  const { error: inputErr } = await service.from("saju_inputs").insert({
    order_id: order.id,
    name: body.name ?? null,
    birth_date: body.birthDate,
    birth_time: body.timeUnknown ? null : body.birthTime,
    time_unknown: body.timeUnknown,
    gender: body.gender,
    calendar: body.calendar,
    concerns: body.concerns,
  });

  if (inputErr) {
    // 무료권 복구 후 주문 제거
    await service.from("referral_rewards").update({ used_at: null, used_order_id: null }).eq("id", reward.id);
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "사주 정보 저장 실패" }, { status: 500 });
  }

  try {
    const { resultId } = await generateAndStoreResult(service, order.id);
    return NextResponse.json({ resultId });
  } catch (err) {
    // 생성 실패 — 무료권 복구, 주문은 failed 처리
    await service.from("referral_rewards").update({ used_at: null, used_order_id: null }).eq("id", reward.id);
    await service.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json(
      { error: "결과 생성에 실패했어요. 무료권은 사용되지 않았으니 다시 시도해 주세요", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
