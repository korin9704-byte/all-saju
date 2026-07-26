import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createServiceClient } from "@/lib/supabase/server";
import { generateAndStoreResult } from "@/lib/saju/generate-result";
import { birthDateSchema } from "@/lib/validation";

// 비공개 링크 전용 무료 고민 사주: 0원 주문 생성 + 결과 즉시 생성 (로그인·결제 없음)
const bodySchema = z.object({
  productId: z.string().uuid(),
  name: z.string().max(50).optional(),
  birthDate: birthDateSchema,
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  timeUnknown: z.boolean(),
  gender: z.enum(["male", "female"]),
  calendar: z.enum(["solar", "lunar"]),
  concerns: z.array(z.string().max(350)).max(20),
  guestEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const service = createServiceClient();

  const { data: product } = await service
    .from("products")
    .select("id, slug")
    .eq("id", body.productId)
    .eq("slug", "trouble-saju-free")
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다" }, { status: 404 });
  }

  // 0원 주문 생성 (비회원 — 이메일 필수)
  const orderId = `free_${nanoid(20)}`;
  const { data: order, error: orderErr } = await service
    .from("orders")
    .insert({
      order_id: orderId,
      user_id: null,
      guest_email: body.guestEmail.trim(),
      product_id: product.id,
      amount: 0,
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[free-trouble] 주문 생성 실패:", orderErr);
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
    concerns: body.concerns,
  });

  if (inputErr) {
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "사주 정보 저장 실패" }, { status: 500 });
  }

  try {
    const { resultId } = await generateAndStoreResult(service, order.id);
    return NextResponse.json({ resultId });
  } catch (err) {
    await service.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json(
      { error: "결과 생성에 실패했어요. 다시 시도해 주세요", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
