// 운 판정(yongsinJudgment)·세운 합충 역산용 컴팩트 수집
// 실행: PROBE_SEED=<시드> pnpm tsx scripts/probe-un-judgment.mts [N] > 출력.jsonl
// 대조: pnpm tsx scripts/eval-un-judgment.mts 출력.jsonl
import { readFileSync } from "node:fs";
import { join } from "node:path";
function loadEnv() {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (n: string) => raw.match(new RegExp(`^${n}=(.*)$`, "m"))?.[1]?.trim();
  return { url: get("SAJU_API_URL")!, key: get("SAJU_API_KEY")! };
}
/* eslint-disable @typescript-eslint/no-explicit-any */
let seed = parseInt(process.env.PROBE_SEED ?? "62260901", 10);
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const env = loadEnv();
const n = parseInt(process.argv[2] ?? "40", 10);
for (let i = 0; i < n; i++) {
  const c = {
    birthYear: String(1950 + Math.floor(rand() * 60)),
    birthMonth: String(1 + Math.floor(rand() * 12)),
    birthDay: String(1 + Math.floor(rand() * 28)),
    birthHour: String(Math.floor(rand() * 24)),
    birthMinute: String(Math.floor(rand() * 60)),
    calendarType: "양력",
    gender: rand() < 0.5 ? "male" : "female",
  };
  const res = await fetch(env.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "SajuBookClient/1.0", "X-SAJU-BOOK-API-KEY": env.key },
    body: JSON.stringify({ ...c, fields: ["ganji", "sipseong", "sinStrength", "gyeokguk", "daeun", "weolun", "seun"] }),
  });
  if (!res.ok) { console.error(`skip ${i}: ${res.status}`); continue; }
  const j: any = await res.json();
  const slim = (it: any) => it && ({ gan: it.gan, ji: it.ji, year: it.year, month: it.month,
    j: it.yongsinJudgment && { 천간: it.yongsinJudgment.천간판정, 지지: it.yongsinJudgment.지지판정, 점수: it.yongsinJudgment.종합점수, 종합: it.yongsinJudgment.종합판정,
      용: it.yongsinJudgment.용신오행, 희: it.yongsinJudgment.희신오행, 기: it.yongsinJudgment.기신오행, 근거: it.yongsinJudgment.판정근거 },
    rel: it.hapChungRelations?.map((h: any) => ({ t: h.type, s: h.source, g: h.target, sp: h.sourcePosition, tp: h.targetPosition })) });
  console.log(JSON.stringify({
    input: c,
    ganji: { year: { gan: j.ganji.year.gan, ji: j.ganji.year.ji }, month: { gan: j.ganji.month.gan, ji: j.ganji.month.ji },
      day: { gan: j.ganji.day.gan, ji: j.ganji.day.ji }, ...(j.ganji.hour ? { hour: { gan: j.ganji.hour.gan, ji: j.ganji.hour.ji } } : {}) },
    summary: j.sipseong?.summary,
    sinStrength: { score: j.sinStrength.score, isStrong: j.sinStrength.isStrong, level: j.sinStrength.level,
      deukryeong: j.sinStrength.deukryeong, deukji: j.sinStrength.deukji, deukse: j.sinStrength.deukse },
    gyeokguk: { type: j.gyeokguk.type, method: j.gyeokguk.yongsin?.method, 용: j.gyeokguk.yongsin?.오행, 희: j.gyeokguk.희신오행, 기: j.gyeokguk.기신오행, 구: j.gyeokguk.구신오행 },
    daeun: { cur: j.daeun.current_daeun?.ganji, all: j.daeun.all_daeun?.map((x: any) => ({ a: x.age_start, g: x.ganji })) },
    weolun: [j.weolun.currentWeolun, j.weolun.nextWeolun, ...(j.weolun.recentWeoluns ?? []), ...(j.weolun.upcomingWeoluns ?? [])].filter(Boolean).map(slim),
    seun: [j.seun.currentSeun, j.seun.nextSeun, ...(j.seun.recentSeuns ?? []), ...(j.seun.upcomingSeuns ?? [])].filter(Boolean).map(slim),
  }));
  await new Promise((r) => setTimeout(r, 300));
}
