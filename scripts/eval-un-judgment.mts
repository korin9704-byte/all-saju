// 운 판정·세운 합충 오프라인 일치율 — _probe-judge 수집 JSONL 대조
// 실행: pnpm tsx scripts/eval-un-judgment.mts <judge.jsonl>
import { readFileSync } from "node:fs";
import { computeLocalAnalysisWithGender, computeUnHapChung, computeUnYongsinSet, judgeUn } from "../src/lib/saju/local-analysis";
/* eslint-disable @typescript-eslint/no-explicit-any */
const rows = readFileSync(process.argv[2], "utf-8").trim().split("\n").map((l) => JSON.parse(l));
const stats: Record<string, { ok: number; total: number }> = {};
const hit = (k: string, c: boolean) => { stats[k] = stats[k] ?? { ok: 0, total: 0 }; stats[k].total++; if (c) stats[k].ok++; };
const scoreErr: number[] = [];
for (const r of rows) {
  const local = computeLocalAnalysisWithGender(r.input as any);
  const set = computeUnYongsinSet(local);
  const first = [...r.weolun, ...r.seun].find((x: any) => x?.j)?.j;
  if (first) {
    hit("판정셋 용신", set.용신오행 === first.용);
    hit("판정셋 희신", set.희신오행 === first.희);
    hit("판정셋 기신", set.기신오행 === first.기);
    hit("판정근거", set.판정근거 === first.근거);
  }
  const seen = new Set<number>();
  for (const it of r.seun) {
    if (!it?.j || seen.has(it.year)) continue; seen.add(it.year);
    // 합충
    const api = (it.rel ?? []).map((h: any) => `${h.t}@${h.tp}`).sort().join("|");
    const mine = computeUnHapChung(it.gan, it.ji, local.ganji, "세운").map((x) => `${x.type}@${x.targetPosition}`).sort().join("|");
    hit("세운 합충", api === mine);
    // 판정
    const j = judgeUn(it.gan, it.ji, set, local.ganji, "세운");
    hit("세운 천간판정", j.천간판정 === it.j.천간 || (j.천간판정 === "희신운" && it.j.천간 === "약신운"));
    hit("세운 지지판정", j.지지판정 === it.j.지지 || (j.지지판정 === "희신운" && it.j.지지 === "약신운"));
    scoreErr.push(Math.abs(j.종합점수 - it.j.점수));
    hit("세운 종합판정", j.종합판정 === it.j.종합);
    hit("세운 종합 ±1단계", Math.abs(["대흉","소흉","평","소길","대길"].indexOf(j.종합판정) - ["대흉","소흉","평","소길","대길"].indexOf(it.j.종합)) <= 1);
  }
  for (const it of r.weolun) {
    if (!it?.j) continue;
    const j = judgeUn(it.gan, it.ji, set, local.ganji, "월운");
    hit("월운 천간판정", j.천간판정 === it.j.천간 || (j.천간판정 === "희신운" && it.j.천간 === "약신운"));
    hit("월운 지지판정", j.지지판정 === it.j.지지 || (j.지지판정 === "희신운" && it.j.지지 === "약신운"));
    hit("월운 종합 ±1단계", Math.abs(["대흉","소흉","평","소길","대길"].indexOf(j.종합판정) - ["대흉","소흉","평","소길","대길"].indexOf(it.j.종합)) <= 1);
  }
}
console.log("===== 운 판정 일치율 =====");
for (const [k, v] of Object.entries(stats)) console.log(`${k.padEnd(14)} ${v.ok}/${v.total} (${Math.round((100 * v.ok) / v.total)}%)`);
console.log(`세운 점수 평균오차 ±${(scoreErr.reduce((a, b) => a + b, 0) / scoreErr.length).toFixed(1)}`);
