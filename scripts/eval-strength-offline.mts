// 오프라인 일치율 측정 — probe JSONL 을 읽어 로컬 계산과 대조 (API 호출 없음)
import { readFileSync } from "node:fs";
import { computeLocalAnalysisWithGender } from "../src/lib/saju/local-analysis";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Api = any;
const file = process.argv[2];
const verbose = process.argv.includes("-v");
const rows = readFileSync(file, "utf-8").trim().split("\n").map((l) => JSON.parse(l));

const stats: Record<string, { ok: number; total: number }> = {};
const hit = (k: string, cond: boolean) => { stats[k] = stats[k] ?? { ok: 0, total: 0 }; stats[k].total++; if (cond) stats[k].ok++; };
const scoreDiffs: number[] = [];

for (const r of rows) {
  const c = { ...r.input };
  const local = computeLocalAnalysisWithGender(c);
  const st: Api = r.sinStrength, gk: Api = r.gyeokguk;
  if (!st || !gk) continue;
  const lst = local.sinStrength, lgk = local.gyeokguk;
  const sd = Math.abs(Number(st.score) - lst.score);
  scoreDiffs.push(sd);
  hit("점수 ±3", sd <= 3); hit("점수 ±5", sd <= 5); hit("점수 ±10", sd <= 10);
  hit("등급(7단계)", Number(st.level) === lst.level);
  hit("등급 ±1", Math.abs(Number(st.level) - lst.level) <= 1);
  hit("강도 라벨", st.strength === lst.strength);
  hit("신강/신약", Boolean(st.isStrong) === lst.isStrong);
  hit("득령", Boolean(st.deukryeong) === lst.deukryeong);
  hit("득지", Boolean(st.deukji) === lst.deukji);
  hit("득세", Boolean(st.deukse) === lst.deukse);
  hit("격국 유형", gk.type === lgk.type);
  hit("격국 이름", gk.name === lgk.name);
  hit("용신 십신", gk.yongsin?.십신 === lgk.yongsin.십신);
  hit("용신 오행", gk.yongsin?.오행 === lgk.yongsin.오행);
  hit("희신", gk.희신오행 === lgk.희신오행);
  hit("기신", gk.기신오행 === lgk.기신오행);
  if (verbose && (gk.yongsin?.오행 !== lgk.yongsin.오행 || gk.name !== lgk.name || Number(st.level) !== lst.level)) {
    const g = r.ganji;
    const pil = ["year","month","day","hour"].map((k)=> g?.[k] ? `${g[k].gan}${g[k].ji}` : "--").join(" ");
    console.log(`${pil} ${c.gender} | score ${st.score}/${lst.score} lvl ${st.level}/${lst.level} ${st.strength}/${lst.strength}` +
      ` | ${gk.type}·${gk.name} vs ${lgk.type}·${lgk.name} | 용신 ${gk.yongsin?.십신}${gk.yongsin?.오행} vs ${lgk.yongsin.십신}${lgk.yongsin.오행}` +
      ` | 희 ${gk.희신오행}/${lgk.희신오행} 기 ${gk.기신오행}/${lgk.기신오행}`);
  }
}
console.log(`\n===== ${file} (${rows.length}건) =====`);
for (const [k, v] of Object.entries(stats)) console.log(`${k.padEnd(12)} ${v.ok}/${v.total} (${Math.round((100*v.ok)/v.total)}%)`);
const avg = scoreDiffs.reduce((a,b)=>a+b,0)/scoreDiffs.length;
console.log(`점수 평균오차 ±${avg.toFixed(2)} 최대 ${Math.max(...scoreDiffs)}`);
