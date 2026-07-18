// =====================================================
// 주문 1건에 대한 사주 결과 생성 공용 모듈
// orders/confirm(토스 결제) · orders/redeem(무료권) · free-mini(무료 미니)
// 세 경로에서 동일하게 사용한다.
// =====================================================

import type { createServiceClient } from "@/lib/supabase/server";
import { computeMyeongsik, type Myeongsik } from "@/lib/saju/manseryeok";
import { sendResultEmail } from "@/lib/email";
import {
  buildSajuPrompt,
  buildWorryPrompt,
  buildTodayFortunePrompt,
  buildDaewunPrompt,
  buildLoveSajuPrompt,
  buildRealEstateSajuPrompt,
  buildRomanceSajuPrompt,
  buildJobSajuPrompt,
  buildBusinessSajuPrompt,
  buildMiniSajuPrompt,
} from "@/lib/saju/prompt";
import { generateInterpretation } from "@/lib/saju/llm";
import {
  isSajuApiConfigured,
  fetchSajuAnalysis,
  formatSajuToManseryeok,
  ganjiToMyeongsik,
  type BirthInfo,
} from "@/lib/saju/saju-api";

type Service = ReturnType<typeof createServiceClient>;

// saju_inputs row → BirthInfo (luckyloveme 입력 형식)
type SajuInputRow = {
  name: string | null;
  birth_date: string;            // "YYYY-MM-DD"
  birth_time: string | null;     // "HH:mm"
  time_unknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
  concerns: string[];
};

function toBirthInfo(input: SajuInputRow): BirthInfo {
  const [y, m, d] = input.birth_date.split("-");
  const hasTime = !input.time_unknown && !!input.birth_time;
  const [hh, mm] = hasTime ? input.birth_time!.split(":") : [undefined, undefined];
  return {
    birthYear: y,
    birthMonth: String(parseInt(m, 10)),
    birthDay: String(parseInt(d, 10)),
    ...(hasTime ? { birthHour: String(parseInt(hh!, 10)), birthMinute: String(parseInt(mm!, 10)) } : {}),
    calendarType: input.calendar === "lunar" ? "음력" : "양력",
    gender: input.gender,
  };
}

function toComputeInput(input: SajuInputRow) {
  return {
    birthDate: input.birth_date,
    birthTime: input.birth_time,
    timeUnknown: input.time_unknown,
    calendar: input.calendar,
    gender: input.gender,
  };
}

/**
 * 주문(uuid pk)의 saju_inputs 로 만세력·LLM 해석을 생성해 saju_results 에 저장하고,
 * guest_email 이 있으면 결과지 메일까지 발송한다. 실패 시 throw.
 */
export async function generateAndStoreResult(service: Service, orderRowId: string): Promise<{ resultId: string }> {
  const { data: order } = await service
    .from("orders")
    .select("id, product_id, guest_email")
    .eq("id", orderRowId)
    .single();
  if (!order) throw new Error("주문 조회 실패");

  const { data: input } = await service
    .from("saju_inputs")
    .select("*")
    .eq("order_id", order.id)
    .single();
  const { data: product } = await service
    .from("products")
    .select("slug, name")
    .eq("id", order.product_id)
    .single();

  if (!input || !product) throw new Error("사주 입력 또는 상품 조회 실패");

  // 만세력/풀 분석: luckyloveme 키가 있으면 실제 API, 없거나 실패하면 mock 으로 fallback
  let myeongsik: Myeongsik;
  let manseryeokText: string | undefined;

  if (isSajuApiConfigured()) {
    try {
      const birthInfo = toBirthInfo(input);
      const analysis = await fetchSajuAnalysis(birthInfo, [], { source: "confirm" }); // [] = 16종 전체
      const converted = ganjiToMyeongsik(analysis);
      if (converted) {
        myeongsik = converted;
        manseryeokText = formatSajuToManseryeok(analysis, birthInfo);
      } else {
        // ganji 필드 누락 — mock 으로 폴백
        myeongsik = await computeMyeongsik(toComputeInput(input));
      }
    } catch (apiErr) {
      // luckyloveme 호출 실패 — 결과지는 무조건 생성해야 하므로 mock 으로 폴백
      console.error("[saju-api] fallback to mock:", apiErr);
      myeongsik = await computeMyeongsik(toComputeInput(input));
    }
  } else {
    myeongsik = await computeMyeongsik(toComputeInput(input));
  }

  const promptInput = {
    productSlug: product.slug,
    productName: product.name,
    myeongsik,
    manseryeokText,
    birthDate: input.birth_date,
    birthTime: input.birth_time,
    timeUnknown: input.time_unknown,
    gender: input.gender,
    concerns: input.concerns,
    name: input.name ?? "",
  };

  let llm;
  if (product.slug === "worry-saju") {
    const { system, user } = buildWorryPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "today-fortune") {
    const { system, user } = buildTodayFortunePrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "premium-saju") {
    const { system, user } = buildDaewunPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "realestate-saju") {
    const { system, user } = buildRealEstateSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "romance-saju") {
    const { system, user } = buildRomanceSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "job-saju") {
    const { system, user } = buildJobSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "business-saju") {
    const { system, user } = buildBusinessSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "free-mini") {
    const { system, user } = buildMiniSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (product.slug === "love-saju") {
    // 상대방 사주 파싱 및 명식 계산
    const partnerConcern = (input.concerns as string[]).find((c: string) => c.startsWith("[상대방]")) ?? "";
    let partnerMyeongsik: Myeongsik | undefined;
    let partnerName: string | undefined;
    let partnerBirthDate: string | undefined;
    let partnerGender: "male" | "female" | undefined;

    if (partnerConcern) {
      const nameMatch      = partnerConcern.match(/이름:([^\s]+)/);
      const birthMatch     = partnerConcern.match(/생년월일:(\d{4}-\d{2}-\d{2})/);
      const timeMatch      = partnerConcern.match(/시간:([^\s]+)/);
      const genderMatch    = partnerConcern.match(/성별:(남성|여성)/);
      const calendarMatch  = partnerConcern.match(/달력:(양력|음력)/);

      partnerName      = nameMatch?.[1]  === "미입력" ? undefined : nameMatch?.[1];
      partnerBirthDate = birthMatch?.[1];
      partnerGender    = genderMatch?.[1] === "남성" ? "male" : "female";
      const partnerCalendar: "solar" | "lunar" = calendarMatch?.[1] === "음력" ? "lunar" : "solar";
      const partnerTimeRaw = timeMatch?.[1] ?? "";
      const partnerTimeUnknown = !partnerTimeRaw || partnerTimeRaw === "시간모름" || partnerTimeRaw === "미입력";
      const partnerBirthTime: string | null = partnerTimeUnknown ? null : partnerTimeRaw;

      if (partnerBirthDate) {
        try {
          if (isSajuApiConfigured()) {
            const pBirthInfo: BirthInfo = (() => {
              const [py, pm, pd] = partnerBirthDate.split("-");
              const hasT = !partnerTimeUnknown && !!partnerBirthTime;
              const [phh, pmm] = hasT ? partnerBirthTime!.split(":") : [undefined, undefined];
              return {
                birthYear: py,
                birthMonth: String(parseInt(pm, 10)),
                birthDay: String(parseInt(pd, 10)),
                ...(hasT ? { birthHour: String(parseInt(phh!, 10)), birthMinute: String(parseInt(pmm!, 10)) } : {}),
                calendarType: partnerCalendar === "lunar" ? "음력" : "양력",
                gender: partnerGender ?? "female",
              };
            })();
            try {
              const pAnalysis = await fetchSajuAnalysis(pBirthInfo, [], { source: "confirm" });
              const pConverted = ganjiToMyeongsik(pAnalysis);
              partnerMyeongsik = pConverted ?? await computeMyeongsik({
                birthDate: partnerBirthDate,
                birthTime: partnerBirthTime,
                timeUnknown: partnerTimeUnknown,
                calendar: partnerCalendar,
                gender: partnerGender ?? "female",
              });
            } catch {
              partnerMyeongsik = await computeMyeongsik({
                birthDate: partnerBirthDate,
                birthTime: partnerBirthTime,
                timeUnknown: partnerTimeUnknown,
                calendar: partnerCalendar,
                gender: partnerGender ?? "female",
              });
            }
          } else {
            partnerMyeongsik = await computeMyeongsik({
              birthDate: partnerBirthDate,
              birthTime: partnerBirthTime,
              timeUnknown: partnerTimeUnknown,
              calendar: partnerCalendar,
              gender: partnerGender ?? "female",
            });
          }
        } catch (e) {
          console.error("[love-saju] partner myeongsik failed:", e);
        }
      }
    }

    const { system, user } = buildLoveSajuPrompt({
      ...promptInput,
      partnerMyeongsik,
      partnerName,
      partnerBirthDate,
      partnerGender,
    });
    llm = await generateInterpretation({ system, user });
  } else {
    const { system, user } = buildSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  }

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
    throw new Error(`결과 저장 실패: ${resultErr?.message ?? "unknown"}`);
  }

  // 결과지 이메일 발송 (실패해도 결과는 반환)
  if (order.guest_email) {
    try {
      await sendResultEmail({
        to: order.guest_email,
        resultId: result.id,
        productName: product.name,
        name: input.name,
      });
    } catch (emailErr) {
      console.error("[generate-result] 이메일 발송 실패:", emailErr);
    }
  }

  return { resultId: result.id };
}
