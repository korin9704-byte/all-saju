import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// MINI 잠금 결과지 언락 주문 생성: 원본 상품 가격(990원)으로 결제 → confirm 에서 locked 해제
const bodySchema = z.object({
  resultId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const { resultId } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const service = createServiceClient();

  // 잠금 결과 + MINI 상품 확인
  const { data: result } = await service
    .from("saju_results")
    .select("id, locked, order_id")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "결과를 찾을 수 없습니다" }, { status: 404 });
  }
  if (!result.locked) {
    return NextResponse.json({ error: "이미 열려 있는 결과예요", resultId }, { status: 409 });
  }

  const { data: miniOrder } = await service
    .from("orders")
    .select("product_id")
    .eq("id", result.order_id)
    .single();
  const { data: miniProduct } = miniOrder
    ? await service.from("products").select("slug").eq("id", miniOrder.product_id).single()
    : { data: null };

  if (!miniProduct || !miniProduct.slug.endsWith("-mini")) {
    return NextResponse.json({ error: "언락 대상이 아닌 결과예요" }, { status: 400 });
  }

  // 원본(풀버전) 상품 — 언락 결제는 풀버전 구매로 기록된다
  const fullSlug = miniProduct.slug.slice(0, -"-mini".length);
  const { data: fullProduct } = await service
    .from("products")
    .select("id, price")
    .eq("slug", fullSlug)
    .maybeSingle();

  if (!fullProduct || fullProduct.price <= 0) {
    return NextResponse.json({ error: "원본 상품을 찾을 수 없습니다" }, { status: 500 });
  }

  const orderId = `ulk_${nanoid(20)}`;
  const { error: orderErr } = await service
    .from("orders")
    .insert({
      order_id: orderId,
      user_id: user.id,
      guest_email: user.email ?? null,
      product_id: fullProduct.id,
      amount: fullProduct.price,
      status: "pending",
      unlock_result_id: result.id,
    });

  if (orderErr) {
    console.error("[unlock] 주문 생성 실패:", orderErr);
    return NextResponse.json({ error: "주문 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ orderId, amount: fullProduct.price });
}
