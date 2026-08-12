// =====================================================
// 섀도 대조 — 실판매 luckyloveme 응답 vs 로컬 계산 차이 기록
// =====================================================
// 결제/생성 흐름에 영향을 주지 않도록 호출부에서 try/catch 로 감싼다.
// 기록은 Supabase Storage(shadow-diffs 버킷)에 JSON 으로 저장하며,
// scripts/shadow-report.ts 로 내려받아 일치율 추이를 분석한다.

import type { createServiceClient } from "@/lib/supabase/server";
import { computeLocalAnalysisWithGender, type LocalAnalysis } from "./local-analysis";
import type { SajuAnalysisResponse } from "./saju-api";

type Service = ReturnType<typeof createServiceClient>;

export type ShadowInput = {
  birth_date: string;            // "YYYY-MM-DD"
  birth_time: string | null;     // "HH:mm"
  time_unknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;

function fmtPillar(p: { gan: string; ji: string } | null | undefined): string {
  return p ? `${p.gan}${p.ji}` : "--";
}

/** API 응답과 로컬 계산의 사실 필드 차이 목록 */
export function diffAnalysis(api: SajuAnalysisResponse, local: LocalAnalysis): string[] {
  const a = api as Api;
  const diffs: string[] = [];
  const set = (name: string, x: string[], y: string[]) => {
    const xs = [...x].sort().join("|"), ys = [...y].sort().join("|");
    if (xs !== ys) diffs.push(`${name}: api=${xs} local=${ys}`);
  };

  const gj = (g: Api) => ["year", "month", "day", "hour"].map((k) => fmtPillar(g?.[k])).join(" ");
  if (a.ganji && gj(a.ganji) !== gj(local.ganji)) diffs.push(`ganji: api=${gj(a.ganji)} local=${gj(local.ganji)}`);

  if (a.sipseong?.sipseongs) {
    set("sipseong",
      a.sipseong.sipseongs.map((s: Api) => `${s.position}:${s.sipseong}`),
      local.sipseong.sipseongs.map((s) => `${s.position}:${s.sipseong}`));
  }
  if (a.twelveFortune?.fortunes) {
    set("twelveFortune",
      a.twelveFortune.fortunes.map((f: Api) => `${f.position}:${f.fortune}`),
      local.twelveFortune.fortunes.map((f) => `${f.position}:${f.fortune}`));
  }
  if (a.sinStrength) {
    const st = a.sinStrength;
    if (Boolean(st.isStrong) !== local.sinStrength.isStrong) diffs.push(`sinStrength.isStrong: api=${st.isStrong} local=${local.sinStrength.isStrong}`);
    if (st.strength !== local.sinStrength.strength) diffs.push(`sinStrength.strength: api=${st.strength} local=${local.sinStrength.strength}`);
    if (Math.abs(Number(st.score) - local.sinStrength.score) > 5) diffs.push(`sinStrength.score: api=${st.score} local=${local.sinStrength.score}`);
    for (const k of ["deukryeong", "deukji", "deukse"] as const) {
      if (Boolean(st[k]) !== local.sinStrength[k]) diffs.push(`sinStrength.${k}: api=${st[k]} local=${local.sinStrength[k]}`);
    }
  }
  if (a.gyeokguk) {
    const gk = a.gyeokguk;
    if (gk.type !== local.gyeokguk.type) diffs.push(`gyeokguk.type: api=${gk.type} local=${local.gyeokguk.type}`);
    if (gk.name !== local.gyeokguk.name) diffs.push(`gyeokguk.name: api=${gk.name} local=${local.gyeokguk.name}`);
    if (gk.yongsin?.오행 !== local.gyeokguk.yongsin.오행) diffs.push(`yongsin: api=${gk.yongsin?.십신}/${gk.yongsin?.오행} local=${local.gyeokguk.yongsin.십신}/${local.gyeokguk.yongsin.오행}`);
  }
  if (a.daeun && !String(a.daeun.target_term ?? "").includes("알 수 없음")) {
    if (a.daeun.direction !== local.daeun.direction) diffs.push(`daeun.direction: api=${a.daeun.direction} local=${local.daeun.direction}`);
    if (Number(a.daeun.daeun_start_age) !== local.daeun.daeun_start_age) diffs.push(`daeun.start_age: api=${a.daeun.daeun_start_age} local=${local.daeun.daeun_start_age}`);
  }
  if (a.sibisinsals?.sibisinsals) {
    set("sibisinsals",
      a.sibisinsals.sibisinsals.map((s: Api) => `${s.position}:${s.name}`),
      local.sibisinsals.sibisinsals.map((s) => `${s.position}:${s.name}`));
  }
  if (a.guiin) {
    for (const key of Object.keys(local.guiin)) {
      set(`guiin.${key}`,
        ((a.guiin[key] ?? []) as Api[]).map((g: Api) => `${g.position}:${g.ji}`),
        local.guiin[key].map((g) => `${g.position}:${g.ji}`));
    }
  }
  return diffs;
}

/** 실판매 응답을 로컬 계산과 대조해 Storage 에 기록 (실패해도 throw 하지 않음) */
export async function recordShadowDiff(
  service: Service,
  orderRowId: string,
  input: ShadowInput,
  analysis: SajuAnalysisResponse,
): Promise<void> {
  try {
    const [, mm, dd] = input.birth_date.split("-");
    const localInput = {
      birthYear: input.birth_date.slice(0, 4),
      birthMonth: String(parseInt(mm, 10)),
      birthDay: String(parseInt(dd, 10)),
      ...(input.time_unknown || !input.birth_time
        ? {}
        : { birthHour: String(parseInt(input.birth_time.slice(0, 2), 10)), birthMinute: String(parseInt(input.birth_time.slice(3, 5), 10)) }),
      calendarType: (input.calendar === "lunar" ? "음력" : "양력") as "양력" | "음력",
      gender: input.gender,
    };
    const local = computeLocalAnalysisWithGender(localInput);
    const diffs = diffAnalysis(analysis, local);
    const a = analysis as Api;

    const record = {
      ts: new Date().toISOString(),
      orderRowId,
      input: localInput,
      diffCount: diffs.length,
      diffs,
      // 향후 산식 재피팅용 원본 사실 필드
      api: {
        ganji: a.ganji,
        sipseong: { sipseongs: a.sipseong?.sipseongs, summary: a.sipseong?.summary },
        sinStrength: a.sinStrength,
        gyeokguk: a.gyeokguk
          ? { type: a.gyeokguk.type, name: a.gyeokguk.name, yongsin: a.gyeokguk.yongsin, 희신오행: a.gyeokguk.희신오행, 기신오행: a.gyeokguk.기신오행, 구신오행: a.gyeokguk.구신오행 }
          : null,
      },
      local: {
        sinStrength: local.sinStrength,
        gyeokguk: { type: local.gyeokguk.type, name: local.gyeokguk.name, yongsin: local.gyeokguk.yongsin, 희신오행: local.gyeokguk.희신오행, 기신오행: local.gyeokguk.기신오행 },
      },
    };

    const day = record.ts.slice(0, 10);
    const path = `${day}/${orderRowId}.json`;
    await service.storage.from("shadow-diffs").upload(path, JSON.stringify(record), {
      contentType: "application/json",
      upsert: true,
    });
  } catch (err) {
    console.error("[shadow-compare] 기록 실패 (판매 흐름에는 영향 없음):", err);
  }
}
