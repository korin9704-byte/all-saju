// =====================================================
// 골든 테스트 2단계 — 로컬 파생 계산 vs luckyloveme 16종 대조
// =====================================================
// 실행: pnpm tsx scripts/golden-analysis.ts
// 설명문(prose)은 비교하지 않고 계산 가능한 사실만 비교한다.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeLocalAnalysisWithGender } from "../src/lib/saju/local-analysis";
import type { LocalGanjiInput } from "../src/lib/saju/local-ganji";

function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (name: string) => raw.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  const url = get("SAJU_API_URL");
  const key = get("SAJU_API_KEY");
  if (!url || !key) throw new Error("SAJU_API_URL / SAJU_API_KEY 없음");
  return { url, key };
}

type Case = LocalGanjiInput & { gender: "male" | "female" };

const CASES: Case[] = [
  { birthYear: "1990", birthMonth: "5", birthDay: "15", birthHour: "10", birthMinute: "30", calendarType: "양력", gender: "female" },
  { birthYear: "1984", birthMonth: "1", birthDay: "3", birthHour: "23", birthMinute: "40", calendarType: "양력", gender: "male" },
  { birthYear: "1996", birthMonth: "8", birthDay: "27", birthHour: "6", birthMinute: "5", calendarType: "양력", gender: "male" },
  { birthYear: "2001", birthMonth: "11", birthDay: "9", birthHour: "18", birthMinute: "45", calendarType: "양력", gender: "female" },
  { birthYear: "1972", birthMonth: "3", birthDay: "30", birthHour: "2", birthMinute: "15", calendarType: "양력", gender: "male" },
  { birthYear: "1988", birthMonth: "7", birthDay: "17", birthHour: "13", birthMinute: "0", calendarType: "양력", gender: "female" },
  { birthYear: "1965", birthMonth: "12", birthDay: "25", birthHour: "9", birthMinute: "50", calendarType: "양력", gender: "female" },
  { birthYear: "1993", birthMonth: "2", birthDay: "4", birthHour: "15", birthMinute: "20", calendarType: "양력", gender: "male" },
  { birthYear: "1979", birthMonth: "6", birthDay: "6", birthHour: "21", birthMinute: "10", calendarType: "음력", gender: "male" },
  { birthYear: "2005", birthMonth: "4", birthDay: "18", calendarType: "양력", gender: "female" },
  { birthYear: "1991", birthMonth: "9", birthDay: "23", calendarType: "양력", gender: "male" },
  { birthYear: "1983", birthMonth: "5", birthDay: "2", calendarType: "양력", gender: "female" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;

async function callApi(env: { url: string; key: string }, c: Case): Promise<Api> {
  const res = await fetch(env.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "SajuBookClient/1.0", "X-SAJU-BOOK-API-KEY": env.key },
    body: JSON.stringify({ ...c, fields: [] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function label(c: Case): string {
  const t = c.birthHour != null ? `${c.birthHour}:${c.birthMinute ?? "0"}` : "시간모름";
  return `${c.birthYear}-${c.birthMonth}-${c.birthDay} ${t} ${c.calendarType} ${c.gender}`;
}

// 정렬된 문자열 배열 비교
function diffSets(name: string, api: string[], local: string[], diffs: string[]) {
  const a = [...api].sort().join(" | ");
  const l = [...local].sort().join(" | ");
  if (a !== l) diffs.push(`${name}:\n    api  =${a}\n    local=${l}`);
}

function compare(api: Api, local: ReturnType<typeof computeLocalAnalysisWithGender>): string[] {
  const diffs: string[] = [];

  // 원국
  const gj = (g: Api) => ["year", "month", "day", "hour"].map((k) => g?.[k] ? `${g[k].gan}${g[k].ji}` : "--").join(" ");
  if (gj(api.ganji) !== gj(local.ganji)) diffs.push(`ganji: api=${gj(api.ganji)} local=${gj(local.ganji)}`);

  // 십성
  diffSets("sipseong",
    (api.sipseong?.sipseongs ?? []).map((s: Api) => `${s.position}:${s.sipseong}`),
    local.sipseong.sipseongs.map((s) => `${s.position}:${s.sipseong}`), diffs);
  const apiSum = api.sipseong?.summary ?? {};
  for (const k of ["bigyeop", "siksang", "jaeseong", "gwanseong", "inseong"] as const) {
    if (Number(apiSum[k]) !== local.sipseong.summary[k]) diffs.push(`sipseong.summary.${k}: api=${apiSum[k]} local=${local.sipseong.summary[k]}`);
  }

  // 12운성
  diffSets("twelveFortune",
    (api.twelveFortune?.fortunes ?? []).map((f: Api) => `${f.position}:${f.fortune}`),
    local.twelveFortune.fortunes.map((f) => `${f.position}:${f.fortune}`), diffs);

  // 신강신약 — 점수 산식은 미공개라 득령/득지만 비교 (강도 라벨·득세는 점수 기반이라 제외)
  const st = api.sinStrength ?? {};
  for (const k of ["deukryeong", "deukji"] as const) {
    if (Boolean(st[k]) !== local.sinStrength[k]) diffs.push(`sinStrength.${k}: api=${st[k]} local=${local.sinStrength[k]}`);
  }

  // 귀인
  for (const key of Object.keys(local.guiin)) {
    diffSets(`guiin.${key}`,
      (api.guiin?.[key] ?? []).map((g: Api) => `${g.position}:${g.ji}`),
      local.guiin[key].map((g) => `${g.position}:${g.ji}`), diffs);
  }

  // 홍염/도화/화개
  diffSets("hongyeom", (api.hongyeom?.hongyeom ?? []).map((x: Api) => `${x.position}:${x.ji}`), local.hongyeom.hongyeom.map((x) => `${x.position}:${x.ji}`), diffs);
  diffSets("dohwa", (api.dohwa?.dohwa ?? []).map((x: Api) => `${x.position}:${x.ji}:${x.type}`), local.dohwa.dohwa.map((x) => `${x.position}:${x.ji}:${x.type}`), diffs);
  diffSets("hwagae", (api.hwagae?.hwagae ?? []).map((x: Api) => `${x.position}:${x.ji}:${x.type}`), local.hwagae.hwagae.map((x) => `${x.position}:${x.ji}:${x.type}`), diffs);

  // 12신살
  diffSets("sibisinsals",
    (api.sibisinsals?.sibisinsals ?? []).map((s: Api) => `${s.position}:${s.name}`),
    local.sibisinsals.sibisinsals.map((s) => `${s.position}:${s.name}`), diffs);

  // 비견겁재
  diffSets("bigyeonGeobjae",
    [...(api.bigyeonGeobjae?.bigyeon ?? []), ...(api.bigyeonGeobjae?.geobjae ?? [])].map((b: Api) => `${b.position}:${b.name}`),
    [...local.bigyeonGeobjae.bigyeon, ...local.bigyeonGeobjae.geobjae].map((b) => `${b.position}:${b.name}`), diffs);

  // 합충형해파 — API의 source/target 순서가 일정치 않아 쌍 단위로 정규화해 비교
  const hapKey = (h: Api) => `${h.type}:${[h.source, h.target].sort().join("")}:${[h.sourcePosition, h.targetPosition].sort().join("-")}`;
  diffSets("hapchung", (api.hapchung ?? []).map(hapKey), local.hapchung.map(hapKey), diffs);

  // 대운 — API 절기 데이터가 없는 연도(target "알 수 없음")는 15일 기본값 폴백이라 비교 제외 (로컬이 더 정확)
  const dae = api.daeun ?? {};
  const daeunFallback = String(dae.target_term ?? "").includes("알 수 없음");
  if (!daeunFallback) {
  if (dae.direction !== local.daeun.direction) diffs.push(`daeun.direction: api=${dae.direction} local=${local.daeun.direction}`);
  if (Number(dae.daeun_start_age) !== local.daeun.daeun_start_age) diffs.push(`daeun.start_age: api=${dae.daeun_start_age} local=${local.daeun.daeun_start_age}`);
  // 시작일은 반올림 방식 차이로 ±1일 허용
  const parseD = (v: string) => { const m = String(v ?? "").match(/(\d+)년 (\d+)월 (\d+)일/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
  const dayGap = Math.abs(parseD(dae.daeun_start_date) - parseD(local.daeun.daeun_start_date)) / 86400000;
  if (!(dayGap <= 1)) diffs.push(`daeun.start_date: api=${dae.daeun_start_date} local=${local.daeun.daeun_start_date}`);
  diffSets("daeun.all",
    (dae.all_daeun ?? []).map((p: Api) => `${p.sequence}:${p.ganji}:${p.age_start}-${p.age_end}:${p.year_start}`),
    local.daeun.all_daeun.map((p) => `${p.sequence}:${p.ganji}:${p.age_start}-${p.age_end}:${p.year_start}`), diffs);
  }

  // 세운
  const seunKey = (s: Api) => `${s.year}:${s.ganji}:${s.age}:${s.sipseongRelation?.gan}/${s.sipseongRelation?.ji}:${s.twelveFortune?.fortune ?? s.twelveFortune}`;
  const localSeunKey = (s: typeof local.seun.currentSeun) => `${s.year}:${s.ganji}:${s.age}:${s.sipseongRelation.gan}/${s.sipseongRelation.ji}:${s.twelveFortune}`;
  if (api.seun) {
    if (seunKey(api.seun.currentSeun) !== localSeunKey(local.seun.currentSeun)) diffs.push(`seun.current: api=${seunKey(api.seun.currentSeun)} local=${localSeunKey(local.seun.currentSeun)}`);
    if (seunKey(api.seun.nextSeun) !== localSeunKey(local.seun.nextSeun)) diffs.push(`seun.next: api=${seunKey(api.seun.nextSeun)} local=${localSeunKey(local.seun.nextSeun)}`);
    diffSets("seun.recent", (api.seun.recentSeuns ?? []).map(seunKey), local.seun.recentSeuns.map(localSeunKey), diffs);
    diffSets("seun.upcoming", (api.seun.upcomingSeuns ?? []).map(seunKey), local.seun.upcomingSeuns.map(localSeunKey), diffs);
  }

  // 월운
  const wKey = (w: Api) => `${w.year}-${w.month}:${w.ganji}:${w.sipseongRelation?.gan}/${w.sipseongRelation?.ji}`;
  const localWKey = (w: typeof local.weolun.currentWeolun) => `${w.year}-${w.month}:${w.ganji}:${w.sipseongRelation.gan}/${w.sipseongRelation.ji}`;
  if (api.weolun) {
    if (wKey(api.weolun.currentWeolun) !== localWKey(local.weolun.currentWeolun)) diffs.push(`weolun.current: api=${wKey(api.weolun.currentWeolun)} local=${localWKey(local.weolun.currentWeolun)}`);
    if (wKey(api.weolun.nextWeolun) !== localWKey(local.weolun.nextWeolun)) diffs.push(`weolun.next: api=${wKey(api.weolun.nextWeolun)} local=${localWKey(local.weolun.nextWeolun)}`);
    diffSets("weolun.recent", (api.weolun.recentWeoluns ?? []).map(wKey), local.weolun.recentWeoluns.map(localWKey), diffs);
    diffSets("weolun.upcoming", (api.weolun.upcomingWeoluns ?? []).map(wKey), local.weolun.upcomingWeoluns.map(localWKey), diffs);
  }

  return diffs;
}

// API 자체 모순으로 확인된 알려진 예외 — 실패로 치지 않고 경고만 표시
// 1) bigyeonGeobjae: 경일간+申일지를 겁재로 표기 (같은 응답의 sipseong 필드는 비견)
// 2) 시간모름 일부 케이스의 년간 십성 오표기 (을→정인 등 산식상 불가능한 값)
function isKnownAnomaly(d: string): boolean {
  if (d.startsWith("bigyeonGeobjae:") && d.includes("겁재") && d.includes("비견")) return true;
  if (d.startsWith("sipseong") && d.includes("정인") && d.includes("상관")) return true;
  return false;
}

function makeRandomCases(n: number): Case[] {
  let seed = 20260812;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: n }, () => ({
    birthYear: String(1945 + Math.floor(rand() * 65)),
    birthMonth: String(1 + Math.floor(rand() * 12)),
    birthDay: String(1 + Math.floor(rand() * 28)),
    birthHour: String(Math.floor(rand() * 24)),
    birthMinute: String(Math.floor(rand() * 60)),
    calendarType: "양력" as const,
    gender: rand() < 0.5 ? ("male" as const) : ("female" as const),
  }));
}

async function main() {
  const env = loadEnv();
  const randArg = process.argv.indexOf("--random");
  const cases = randArg >= 0 ? makeRandomCases(parseInt(process.argv[randArg + 1], 10)) : CASES;
  let clean = 0;
  for (const c of cases) {
    let api: Api;
    try {
      api = await callApi(env, c);
    } catch (err) {
      console.log(`[API오류] ${label(c)} — ${err instanceof Error ? err.message : err}`);
      continue;
    }
    const local = computeLocalAnalysisWithGender(c);
    const allDiffs = compare(api, local);
    const anomalies = allDiffs.filter(isKnownAnomaly);
    // 십성 리스트가 알려진 모순이면 그 파생인 summary 차이도 함께 허용
    const diffs = allDiffs.filter((d) => !isKnownAnomaly(d)
      && !(anomalies.some((a) => a.startsWith("sipseong")) && d.startsWith("sipseong.summary.")));
    for (const a of anomalies) console.log(`  (알려진 API 모순, 허용) ${label(c)} — ${a.split(String.fromCharCode(10))[0]}`);
    if (diffs.length === 0) {
      clean++;
      console.log(`  OK  ${label(c)}`);
    } else {
      console.log(`FAIL  ${label(c)} — ${diffs.length}개 항목 불일치`);
      for (const d of diffs) console.log("  - " + d);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`\n===== ${clean}/${cases.length} 케이스 완전 일치 =====`);
}

main().catch((e) => { console.error(e); process.exit(1); });
