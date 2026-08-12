// =====================================================
// 신강 점수·격국 로컬 구현 vs luckyloveme 일치율 측정
// =====================================================
// 실행: pnpm tsx scripts/validate-strength.ts [N]
// 피팅에 쓰지 않은 새 랜덤 케이스로 일치율을 측정한다 (기본 30개).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeLocalAnalysisWithGender } from "../src/lib/saju/local-analysis";

function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (name: string) => raw.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  return { url: get("SAJU_API_URL")!, key: get("SAJU_API_KEY")! };
}

let seed = parseInt(process.env.VAL_SEED ?? "33260813", 10); // 피팅에 안 쓴 시드
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;

async function main() {
  const env = loadEnv();
  const n = parseInt(process.argv[2] ?? "30", 10);
  const stats: Record<string, { ok: number; total: number }> = {};
  const hit = (k: string, cond: boolean) => {
    stats[k] = stats[k] ?? { ok: 0, total: 0 };
    stats[k].total++;
    if (cond) stats[k].ok++;
  };
  const scoreDiffs: number[] = [];

  for (let i = 0; i < n; i++) {
    const c = {
      birthYear: String(1950 + Math.floor(rand() * 60)),
      birthMonth: String(1 + Math.floor(rand() * 12)),
      birthDay: String(1 + Math.floor(rand() * 28)),
      birthHour: String(Math.floor(rand() * 24)),
      birthMinute: String(Math.floor(rand() * 60)),
      calendarType: "양력" as const,
      gender: rand() < 0.5 ? ("male" as const) : ("female" as const),
    };
    const res = await fetch(env.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SajuBookClient/1.0", "X-SAJU-BOOK-API-KEY": env.key },
      body: JSON.stringify({ ...c, fields: ["sinStrength", "gyeokguk"] }),
    });
    if (!res.ok) { console.error(`skip: ${res.status}`); continue; }
    const api: Api = await res.json();
    const local = computeLocalAnalysisWithGender(c);
    const st: Api = api.sinStrength, gk: Api = api.gyeokguk;
    const lst = local.sinStrength, lgk = local.gyeokguk;

    const sd = Math.abs(Number(st.score) - lst.score);
    scoreDiffs.push(sd);
    hit("점수 ±5", sd <= 5);
    hit("점수 ±10", sd <= 10);
    hit("등급(7단계)", Number(st.level) === lst.level);
    hit("등급 ±1", Math.abs(Number(st.level) - lst.level) <= 1);
    hit("강도 라벨", st.strength === lst.strength);
    hit("신강/신약 방향", Boolean(st.isStrong) === lst.isStrong);
    hit("득령", Boolean(st.deukryeong) === lst.deukryeong);
    hit("득지", Boolean(st.deukji) === lst.deukji);
    hit("득세", Boolean(st.deukse) === lst.deukse);
    hit("격국 유형", gk.type === lgk.type);
    hit("격국 이름", gk.name === lgk.name);
    hit("용신 십신", gk.yongsin?.십신 === lgk.yongsin.십신);
    hit("용신 오행", gk.yongsin?.오행 === lgk.yongsin.오행);
    hit("희신", gk.희신오행 === lgk.희신오행);
    hit("기신", gk.기신오행 === lgk.기신오행);
    if (gk.name !== lgk.name || Number(st.level) !== lst.level || gk.yongsin?.오행 !== lgk.yongsin.오행) {
      console.log(`  diff ${c.birthYear}-${c.birthMonth}-${c.birthDay} ${c.birthHour}:${c.birthMinute} ${c.gender}` +
        ` | score api=${st.score} local=${lst.score} lvl ${st.level}/${lst.level} ${st.strength}/${lst.strength}` +
        ` | ${gk.type}·${gk.name} vs ${lgk.type}·${lgk.name} | 용신 ${gk.yongsin?.십신}${gk.yongsin?.오행} vs ${lgk.yongsin.십신}${lgk.yongsin.오행}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\n===== 일치율 =====");
  for (const [k, v] of Object.entries(stats)) {
    console.log(`${k.padEnd(12)} ${v.ok}/${v.total} (${Math.round((100 * v.ok) / v.total)}%)`);
  }
  const avg = scoreDiffs.reduce((a, b) => a + b, 0) / scoreDiffs.length;
  console.log(`점수 평균 오차 ±${avg.toFixed(1)}점, 최대 ${Math.max(...scoreDiffs)}점`);
}

main().catch((e) => { console.error(e); process.exit(1); });
