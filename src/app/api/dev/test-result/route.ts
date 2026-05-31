import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeMyeongsik } from "@/lib/saju/manseryeok";
import {
  buildSajuPrompt,
  buildWorryPrompt,
  buildTodayFortunePrompt,
  buildDaewunPrompt,
  buildLoveSajuPrompt,
} from "@/lib/saju/prompt";
import { generateInterpretation } from "@/lib/saju/llm";

// 개발 전용 — 결제 없이 테스트 결과 생성
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "개발 환경에서만 사용 가능합니다." }, { status: 403 });
  }

  const { slug } = await request.json();
  const service = createServiceClient();

  // 1. 상품 ID 조회
  const { data: product, error: productErr } = await service
    .from("products")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (productErr || !product) {
    return NextResponse.json({ error: `상품을 찾을 수 없습니다: ${slug}` }, { status: 404 });
  }

  // 2. 더미 주문 생성 (dev 테스트용)
  const { data: order, error: orderErr } = await service
    .from("orders")
    .insert({
      order_id: `dev_test_${Date.now()}`,
      product_id: product.id,
      amount: 0,
      status: "paid",
      guest_email: "dev@test.local",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "더미 주문 생성 실패", detail: orderErr?.message }, { status: 500 });
  }

  // 3. 테스트용 기본 입력값
  const testInput = {
    birth_date: "1990-03-15",
    birth_time: "10:30",
    time_unknown: false,
    calendar: "solar" as const,
    gender: "female" as const,
    concerns: ["올해 직장운과 재물운이 어떤지 궁금해요."],
    name: "고영희",
  };

  try {
    const myeongsik = await computeMyeongsik({
      birthDate: testInput.birth_date,
      birthTime: testInput.birth_time,
      timeUnknown: testInput.time_unknown,
      calendar: testInput.calendar,
      gender: testInput.gender,
    });

    const promptInput = {
      productSlug: slug,
      productName: product.name,
      myeongsik,
      birthDate: testInput.birth_date,
      birthTime: testInput.birth_time,
      timeUnknown: testInput.time_unknown,
      gender: testInput.gender,
      concerns: testInput.concerns,
      name: testInput.name,
    };

    let llm;
    if (slug === "worry-saju") {
      const { system, user } = buildWorryPrompt(promptInput);
      llm = await generateInterpretation({ system, user });
    } else if (slug === "today-fortune") {
      const { system, user } = buildTodayFortunePrompt(promptInput);
      llm = await generateInterpretation({ system, user });
    } else if (slug === "premium-saju") {
      const { system, user } = buildDaewunPrompt(promptInput);
      llm = await generateInterpretation({ system, user });
    } else if (slug === "love-saju") {
      const partnerMyeongsik = await computeMyeongsik({
        birthDate: "1988-07-22",
        birthTime: "14:00",
        timeUnknown: false,
        calendar: "solar",
        gender: "male",
      });
      const { system, user } = buildLoveSajuPrompt({
        ...promptInput,
        partnerMyeongsik,
        partnerName: "홍길동",
        partnerBirthDate: "1988-07-22",
        partnerGender: "male",
      });
      llm = await generateInterpretation({ system, user });
    } else {
      const { system, user } = buildSajuPrompt(promptInput);
      llm = await generateInterpretation({ system, user });
    }

    // 4. 결과 저장
    const { data: result, error: resultErr } = await service
      .from("saju_results")
      .insert({
        order_id: order.id,
        myeongsik: myeongsik as never,
        interpretation_md: llm.text,
        llm_provider: llm.provider,
        llm_model: llm.model,
      })
      .select("id")
      .single();

    if (resultErr || !result) {
      return NextResponse.json({ error: "결과 저장 실패", detail: resultErr?.message }, { status: 500 });
    }

    return NextResponse.json({ resultId: result.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
