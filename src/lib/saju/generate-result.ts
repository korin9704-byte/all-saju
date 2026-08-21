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
  buildTroubleSajuPrompt,
} from "@/lib/saju/prompt";
import { generateInterpretation } from "@/lib/saju/llm";
import {
  isSajuApiConfigured,
  fetchSajuAnalysis,
  formatSajuToManseryeok,
  ganjiToMyeongsik,
  type BirthInfo,
  type SajuAnalysisResponse,
} from "@/lib/saju/saju-api";
import { generateLifeReport, LIFE_SLUG } from "@/lib/saju/life-report";

type Service = ReturnType<typeof createServiceClient>;

/** 고민 사주 + 정통 사주 번들 상품 slug */
export const BUNDLE_SLUG = "trouble-saju-bundle";
/** 번들 자식 주문(정통 사주) order_id 접미사 */
export const BUNDLE_CHILD_SUFFIX = "-jt";

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

/** '## ' 섹션이 max개를 넘으면 초과분을 잘라낸다 (사주 풀이 13개 고정) */
function limitSections(markdown: string, max: number): string {
  const parts = markdown.split(/\n(?=## )/);
  const sections: string[] = [];
  let preamble = "";
  for (const part of parts) {
    if (part.trim().startsWith("## ")) sections.push(part);
    else if (sections.length === 0 && part.trim()) preamble = part;
  }
  if (sections.length <= max) return markdown;
  return (preamble ? `${preamble}\n` : "") + sections.slice(0, max).join("\n");
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
export async function generateAndStoreResult(
  service: Service,
  orderRowId: string,
  opts?: { skipEmail?: boolean },
): Promise<{ resultId: string }> {
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

  // MINI 상품(slug 접미사 -mini)은 원본 상품과 동일한 결과지를 생성하고 잠금 상태로 저장한다
  const isMini = product.slug.endsWith("-mini");
  // 번들(고민+정통) 주문의 본 결과지는 고민 사주 풀이 — 정통 사주는 자식 주문에서 별도 생성
  const isBundle = product.slug === BUNDLE_SLUG;
  const promptSlug = isMini ? product.slug.slice(0, -"-mini".length) : isBundle ? "trouble-saju" : product.slug;
  const promptName = isMini ? product.name.replace(/\s*MINI$/i, "") : isBundle ? "고민 사주" : product.name;

  // 만세력/풀 분석: luckyloveme 키가 있으면 실제 API, 없거나 실패하면 mock 으로 fallback
  let myeongsik: Myeongsik;
  let manseryeokText: string | undefined;
  let fullAnalysis: SajuAnalysisResponse | null = null;

  if (isSajuApiConfigured()) {
    try {
      const birthInfo = toBirthInfo(input);
      const analysis = await fetchSajuAnalysis(birthInfo, [], { source: "confirm" }); // [] = 16종 전체
      const converted = ganjiToMyeongsik(analysis);
      if (converted) {
        myeongsik = converted;
        fullAnalysis = analysis;
        manseryeokText = formatSajuToManseryeok(analysis, birthInfo);
        // 섀도 대조 — 로컬 만세력과의 차이 기록.
        // 동적 import + 이중 try/catch 로 어떤 실패도 판매 흐름에 전파되지 않게 격리.
        try {
          const { recordShadowDiff } = await import("@/lib/saju/shadow-compare");
          await recordShadowDiff(service, order.id, {
            birth_date: input.birth_date,
            birth_time: input.birth_time,
            time_unknown: input.time_unknown,
            calendar: input.calendar,
            gender: input.gender,
          }, analysis);
        } catch (shadowErr) {
          console.error("[shadow-compare] 기록 생략:", shadowErr);
        }
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
    productSlug: promptSlug,
    productName: promptName,
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
  if (promptSlug === LIFE_SLUG) {
    // 인생 사주 — 13장 평생 리포트 (27개 파트 병렬 생성, luckyloveme 풀 분석 필수)
    if (!fullAnalysis) {
      throw new Error("인생 사주 결과지 생성 실패: 만세력 풀 분석 API를 사용할 수 없습니다");
    }
    const jobConcern = (input.concerns as string[]).find((c) => c.startsWith("[직업]"));
    const life = await generateLifeReport(fullAnalysis, {
      name: input.name ?? "",
      birthDate: input.birth_date,
      birthTime: input.birth_time,
      timeUnknown: input.time_unknown,
      calendar: input.calendar,
      gender: input.gender,
      job: jobConcern?.replace("[직업]", "").trim() || undefined,
    });
    llm = { text: JSON.stringify(life.payload), provider: life.provider, model: life.model };
  } else if (promptSlug === "worry-saju") {
    const { system, user } = buildWorryPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "today-fortune") {
    const { system, user } = buildTodayFortunePrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "premium-saju") {
    const { system, user } = buildDaewunPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "realestate-saju") {
    const { system, user } = buildRealEstateSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "romance-saju") {
    const { system, user } = buildRomanceSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "job-saju") {
    const { system, user } = buildJobSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "business-saju") {
    const { system, user } = buildBusinessSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "trouble-saju" || promptSlug === "followup-question" || promptSlug === "trouble-saju-free") {
    const { system, user } = buildTroubleSajuPrompt(promptInput);
    llm = await generateInterpretation({ system, user });
  } else if (promptSlug === "love-saju") {
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

  // 섹션 수 고정 — LLM이 넘치게 쓰면 잘라낸다 (사주 풀이·질문 13개, 궁합은 점수·제목 포함 15개)
  const interpretationMd =
    promptSlug === "today-fortune" || promptSlug === "worry-saju"
      ? limitSections(llm.text, 13)
      : promptSlug === "love-saju"
        ? limitSections(llm.text, 15)
        : llm.text;

  const { data: result, error: resultErr } = await service
    .from("saju_results")
    .insert({
      order_id: order.id,
      myeongsik: myeongsik as never,
      interpretation_md: interpretationMd,
      llm_provider: llm.provider,
      llm_model: llm.model,
      locked: isMini,
    })
    .select("id")
    .single();

  if (resultErr || !result) {
    throw new Error(`결과 저장 실패: ${resultErr?.message ?? "unknown"}`);
  }

  // 결과지 이메일 발송 (실패해도 결과는 반환)
  if (order.guest_email && !opts?.skipEmail) {
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

/**
 * 번들(고민 사주 + 정통 사주) 주문 처리:
 * 부모 주문으로 고민 사주 결과지를, 0원 자식 주문(order_id 접미사 -jt)으로
 * 정통 사주 결과지를 병렬 생성한다. 반환값은 부모(고민 사주) resultId.
 */
export async function generateBundleResults(
  service: Service,
  parentRowId: string,
): Promise<{ resultId: string; jeongtongResultId: string }> {
  const { data: parent } = await service
    .from("orders")
    .select("id, order_id, user_id, guest_email")
    .eq("id", parentRowId)
    .single();
  if (!parent) throw new Error("번들 부모 주문 조회 실패");

  const { data: input } = await service
    .from("saju_inputs")
    .select("*")
    .eq("order_id", parent.id)
    .single();
  if (!input) throw new Error("번들 사주 입력 조회 실패");

  const { data: todayProduct } = await service
    .from("products")
    .select("id")
    .eq("slug", "today-fortune")
    .single();
  if (!todayProduct) throw new Error("정통 사주 상품 조회 실패");

  // 자식 주문 — 재시도 대비 idempotent (이미 있으면 재사용)
  const childOrderId = `${parent.order_id}${BUNDLE_CHILD_SUFFIX}`;
  let childRowId: string;
  const { data: existingChild } = await service
    .from("orders")
    .select("id")
    .eq("order_id", childOrderId)
    .maybeSingle();

  if (existingChild) {
    childRowId = existingChild.id;
  } else {
    const { data: child, error: childErr } = await service
      .from("orders")
      .insert({
        order_id: childOrderId,
        user_id: parent.user_id,
        guest_email: parent.guest_email,
        product_id: todayProduct.id,
        amount: 0,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (childErr || !child) throw new Error(`번들 자식 주문 생성 실패: ${childErr?.message ?? "unknown"}`);
    childRowId = child.id;

    // 정통 사주는 고민 텍스트 없이 사주 정보만 사용
    const { error: inputErr } = await service.from("saju_inputs").insert({
      order_id: childRowId,
      name: input.name,
      birth_date: input.birth_date,
      birth_time: input.birth_time,
      time_unknown: input.time_unknown,
      gender: input.gender,
      calendar: input.calendar,
      concerns: [],
    });
    if (inputErr) throw new Error(`번들 자식 사주 입력 저장 실패: ${inputErr.message}`);
  }

  // 이메일은 부모(고민 사주 + 정통 사주) 결과지 1통만 발송 — 정통 사주는 결과지 탭으로 이동
  const [parentRes, childRes] = await Promise.all([
    generateAndStoreResult(service, parent.id),
    generateAndStoreResult(service, childRowId, { skipEmail: true }),
  ]);

  return { resultId: parentRes.resultId, jeongtongResultId: childRes.resultId };
}
