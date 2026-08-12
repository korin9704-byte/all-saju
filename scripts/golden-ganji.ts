// =====================================================
// 골든 테스트 — 로컬 원국 계산 vs luckyloveme ganji 대조
// =====================================================
// 실행: pnpm tsx scripts/golden-ganji.ts [--limit N]
// .env.local 의 SAJU_API_URL / SAJU_API_KEY 를 사용해 실제 API 와
// 로컬 계산(src/lib/saju/local-ganji.ts)을 케이스별로 비교한다.
// 실서비스 데이터/코드는 건드리지 않는다 (API 호출만 발생 — 건당 과금 주의).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeLocalGanji, type LocalGanjiInput } from "../src/lib/saju/local-ganji";

type ApiGanji = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour?: { gan: string; ji: string };
};

// ── .env.local 파싱 ─────────────────────────────────
function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (name: string) => raw.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  const url = get("SAJU_API_URL");
  const key = get("SAJU_API_KEY");
  if (!url || !key) throw new Error("SAJU_API_URL / SAJU_API_KEY 없음");
  return { url, key };
}

// ── 테스트 케이스 ───────────────────────────────────
// 경계 케이스: 입춘 부근(년주), 절기 부근(월주), 자시/시지 경계(시주·일주),
// 서머타임 시행기(1948~60, 1987~88), 음력·윤달
const EDGE_CASES: LocalGanjiInput[] = [
  // 입춘 경계 (2월 3~5일)
  { birthYear: "1990", birthMonth: "2", birthDay: "4", birthHour: "5", birthMinute: "0", calendarType: "양력" },
  { birthYear: "1990", birthMonth: "2", birthDay: "4", birthHour: "23", birthMinute: "30", calendarType: "양력" },
  { birthYear: "2000", birthMonth: "2", birthDay: "4", birthHour: "10", birthMinute: "0", calendarType: "양력" },
  { birthYear: "1985", birthMonth: "2", birthDay: "3", birthHour: "22", birthMinute: "0", calendarType: "양력" },
  // 자시 경계 (23:00~01:00)
  { birthYear: "1992", birthMonth: "7", birthDay: "10", birthHour: "23", birthMinute: "10", calendarType: "양력" },
  { birthYear: "1992", birthMonth: "7", birthDay: "10", birthHour: "0", birthMinute: "30", calendarType: "양력" },
  { birthYear: "1992", birthMonth: "7", birthDay: "10", birthHour: "22", birthMinute: "50", calendarType: "양력" },
  // 시지 경계 (홀수시 ±20분 — 진태양시 보정 여부 탐지)
  { birthYear: "1995", birthMonth: "10", birthDay: "20", birthHour: "13", birthMinute: "10", calendarType: "양력" },
  { birthYear: "1995", birthMonth: "10", birthDay: "20", birthHour: "12", birthMinute: "50", calendarType: "양력" },
  { birthYear: "1995", birthMonth: "10", birthDay: "20", birthHour: "13", birthMinute: "40", calendarType: "양력" },
  // 절기(월주) 경계 — 청명(4/4~5), 한로(10/8) 부근
  { birthYear: "1988", birthMonth: "4", birthDay: "4", birthHour: "21", birthMinute: "0", calendarType: "양력" },
  { birthYear: "1988", birthMonth: "10", birthDay: "8", birthHour: "9", birthMinute: "0", calendarType: "양력" },
  // 서머타임 시행기
  { birthYear: "1988", birthMonth: "6", birthDay: "15", birthHour: "14", birthMinute: "0", calendarType: "양력" },
  { birthYear: "1955", birthMonth: "7", birthDay: "1", birthHour: "23", birthMinute: "20", calendarType: "양력" },
  // 음력 (평달 · 윤달)
  { birthYear: "1990", birthMonth: "5", birthDay: "15", birthHour: "10", birthMinute: "30", calendarType: "음력" },
  { birthYear: "1987", birthMonth: "6", birthDay: "10", birthHour: "8", birthMinute: "0", calendarType: "음력", isLeapMonth: true },
  // 시간 미상
  { birthYear: "1975", birthMonth: "3", birthDay: "21", calendarType: "양력" },
  { birthYear: "2003", birthMonth: "12", birthDay: "31", calendarType: "양력" },
];

// 결정론적 의사난수(LCG) — 재실행해도 같은 케이스
function makeRandomCases(n: number): LocalGanjiInput[] {
  let seed = 20260811;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const cases: LocalGanjiInput[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1940 + Math.floor(rand() * 70);          // 1940~2009
    const mo = 1 + Math.floor(rand() * 12);
    const d = 1 + Math.floor(rand() * 28);
    const h = Math.floor(rand() * 24);
    const mi = Math.floor(rand() * 60);
    cases.push({
      birthYear: String(y), birthMonth: String(mo), birthDay: String(d),
      birthHour: String(h), birthMinute: String(mi), calendarType: "양력",
    });
  }
  return cases;
}

async function callApi(env: { url: string; key: string }, c: LocalGanjiInput): Promise<ApiGanji> {
  const res = await fetch(env.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "SajuBookClient/1.0",
      "X-SAJU-BOOK-API-KEY": env.key,
    },
    body: JSON.stringify({ ...c, gender: "female", fields: ["ganji"] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { ganji?: ApiGanji };
  if (!json.ganji) throw new Error(`ganji 없음: ${JSON.stringify(json).slice(0, 200)}`);
  return json.ganji;
}

function fmt(g: { gan: string; ji: string } | null | undefined): string {
  return g ? `${g.gan}${g.ji}` : "--";
}

function caseLabel(c: LocalGanjiInput): string {
  const t = c.birthHour != null ? `${c.birthHour.padStart(2, "0")}:${(c.birthMinute ?? "0").padStart(2, "0")}` : "시간모름";
  return `${c.birthYear}-${c.birthMonth.padStart(2, "0")}-${c.birthDay.padStart(2, "0")} ${t} ${c.calendarType}${c.isLeapMonth ? "(윤달)" : ""}`;
}

async function main() {
  const env = loadEnv();
  const limitArg = process.argv.indexOf("--limit");
  const randomN = limitArg >= 0 ? Math.max(0, parseInt(process.argv[limitArg + 1], 10) - EDGE_CASES.length) : 42;
  const cases = [...EDGE_CASES, ...makeRandomCases(randomN)];

  let pass = 0;
  const failures: string[] = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    let api: ApiGanji;
    try {
      api = await callApi(env, c);
    } catch (err) {
      failures.push(`[API오류] ${caseLabel(c)} — ${err instanceof Error ? err.message : err}`);
      continue;
    }
    const local = computeLocalGanji(c);

    const parts: string[] = [];
    if (fmt(api.year) !== fmt(local.year)) parts.push(`년주 api=${fmt(api.year)} local=${fmt(local.year)}`);
    if (fmt(api.month) !== fmt(local.month)) parts.push(`월주 api=${fmt(api.month)} local=${fmt(local.month)}`);
    if (fmt(api.day) !== fmt(local.day)) parts.push(`일주 api=${fmt(api.day)} local=${fmt(local.day)}`);
    // 시간 미상 케이스는 API가 시주를 어떻게 주는지 관찰만
    if (c.birthHour != null && fmt(api.hour) !== fmt(local.hour)) parts.push(`시주 api=${fmt(api.hour)} local=${fmt(local.hour)}`);

    if (parts.length === 0) {
      pass++;
      console.log(`  OK  ${caseLabel(c)}  ${fmt(local.year)} ${fmt(local.month)} ${fmt(local.day)} ${fmt(local.hour)}`);
    } else {
      failures.push(`[불일치] ${caseLabel(c)} — ${parts.join(", ")}`);
      console.log(`FAIL  ${caseLabel(c)} — ${parts.join(", ")}`);
    }
    if (c.birthHour == null) console.log(`      (시간모름 API 시주: ${fmt(api.hour)})`);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n===== 결과: ${pass}/${cases.length} 일치 =====`);
  if (failures.length) {
    console.log("\n불일치 목록:");
    for (const f of failures) console.log(" - " + f);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
