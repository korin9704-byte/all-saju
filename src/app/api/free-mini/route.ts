import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateAndStoreResult } from "@/lib/saju/generate-result";
import { REFERRAL_REWARD_CAP } from "@/lib/referral";

const bodySchema = z.object({
  name: z.string().max(50).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  timeUnknown: z.boolean(),
  gender: z.enum(["male", "female"]),
  calendar: z.enum(["solar", "lunar"]),
  ref: z.string().max(32).optional(), // 추천인 코드
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
    .select("id, name")
    .eq("slug", "free-mini")
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "무료 미니 사주 상품이 없습니다. 마이그레이션을 확인하세요" }, { status: 500 });
  }

  // 유저당 1회 — 이미 본 사람은 기존 결과로 (idempotent)
  const { data: existing } = await service
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", product.id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: prevResult } = await service
      .from("saju_results")
      .select("id")
      .eq("order_id", existing.id)
      .maybeSingle();
    if (prevResult) {
      return NextResponse.json({ resultId: prevResult.id, already: true });
    }
    // 결과 없이 주문만 남은 비정상 상태 — 주문 제거 후 새로 진행
    await service.from("orders").delete().eq("id", existing.id);
  }

  // 0원 주문 생성 (결제 없음 → 바로 paid)
  const orderId = `free_${nanoid(20)}`;
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
    console.error("[free-mini] 주문 생성 실패:", orderErr);
    return NextResponse.json({ error: "주문 생성 실패" }, { status: 500 });
  }

  const { error: inputErr } = await service.from("saju_inputs").insert({
    order_id: order.id,
    name: body.name ?? null,
    birth_date: body.birthDate,
    birth_time: body.timeUnknown ? null : body.birthTime,
    time_unknown: body.timeUnknown,
    gender: body.gender,
    calendar: body.calendar,
    concerns: [],
  });

  if (inputErr) {
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "사주 정보 저장 실패" }, { status: 500 });
  }

  let resultId: string;
  try {
    ({ resultId } = await generateAndStoreResult(service, order.id));
  } catch (err) {
    // 생성 실패 시 주문 제거 → 재시도 가능
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "미니 사주 생성에 실패했어요. 잠시 후 다시 시도해 주세요", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  // ── 추천인 무료권 적립 (실패해도 미니 결과에는 영향 없음) ──
  if (body.ref) {
    try {
      const { data: referrer } = await service
        .from("profiles")
        .select("id")
        .eq("referral_code", body.ref)
        .maybeSingle();

      if (referrer && referrer.id !== user.id) {
        const { count } = await service
          .from("referral_rewards")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", referrer.id);

        if ((count ?? 0) < REFERRAL_REWARD_CAP) {
          // referred_user_id unique — 같은 친구는 평생 1회만 적립됨 (충돌은 조용히 무시)
          const { error: rewardErr } = await service.from("referral_rewards").insert({
            referrer_id: referrer.id,
            referred_user_id: user.id,
            mini_order_id: order.id,
          });
          if (rewardErr && rewardErr.code !== "23505") {
            console.error("[free-mini] 무료권 적립 실패:", rewardErr);
          }
        }
      }
    } catch (rewardErr) {
      console.error("[free-mini] 무료권 적립 중 오류:", rewardErr);
    }
  }

  return NextResponse.json({ resultId });
}
