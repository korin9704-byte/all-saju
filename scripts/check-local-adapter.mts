// 로컬 어댑터 출력이 luckyloveme 응답 형태와 호환되는지 점검
// 실행: pnpm tsx scripts/check-local-adapter.mts <luckyloveme-full-response.json>
import { readFileSync } from "node:fs";
import { computeLocalFullAnalysis } from "../src/lib/saju/local-adapter";

/* eslint-disable @typescript-eslint/no-explicit-any */
const [, , refPath] = process.argv;
const ref: any = refPath ? JSON.parse(readFileSync(refPath, "utf-8")) : null;

// 기준 응답과 같은 생년월일 (1990-05-15 10:30 여성)
const local: any = computeLocalFullAnalysis({
  birthDate: "1990-05-15",
  birthTime: "10:30",
  timeUnknown: false,
  calendar: "solar",
  gender: "female",
});

const issues: string[] = [];
const eq = (label: string, a: unknown, b: unknown) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) issues.push(`${label}: local=${JSON.stringify(a)} ref=${JSON.stringify(b)}`);
};

// 1) life-report 가 소비하는 경로들이 존재하고 값이 맞는지
for (const k of ["year", "month", "day", "hour"]) {
  const lp = local.ganji[k], rp = ref?.ganji?.[k];
  if (!lp) { issues.push(`ganji.${k} 없음`); continue; }
  for (const f of ["gan", "ji", "ganHanja", "jiHanja"]) eq(`ganji.${k}.${f}`, lp[f], rp?.[f]);
  eq(`ganji.${k}.ohaeng`, lp.ohaeng, rp?.ohaeng);
  eq(`ganji.${k}.eumyang`, lp.eumyang, rp?.eumyang);
}
eq("sipseong.sipseongs(위치/십성)", local.sipseong.sipseongs.map((s: any) => [s.position, s.sipseong]),
   ref?.sipseong?.sipseongs?.map((s: any) => [s.position, s.sipseong]));
eq("twelveFortune(위치/운성)", local.twelveFortune.fortunes.map((f: any) => [f.position, f.fortune]),
   ref?.twelveFortune?.fortunes?.map((f: any) => [f.position, f.fortune]));
eq("sinStrength.strength", local.sinStrength.strength, ref?.sinStrength?.strength);
eq("gyeokguk.용신", local.gyeokguk.yongsin?.오행, ref?.gyeokguk?.yongsin?.오행);
eq("gyeokguk.희신/기신", [local.gyeokguk.희신오행, local.gyeokguk.기신오행], [ref?.gyeokguk?.희신오행, ref?.gyeokguk?.기신오행]);
eq("sibisinsals", local.sibisinsals.sibisinsals.map((s: any) => [s.position, s.name]),
   ref?.sibisinsals?.sibisinsals?.map((s: any) => [s.position, s.name]));
eq("dohwa", local.dohwa.dohwa.map((x: any) => x.position), ref?.dohwa?.dohwa?.map((x: any) => x.position));
eq("hwagae", local.hwagae.hwagae.map((x: any) => x.position), ref?.hwagae?.hwagae?.map((x: any) => x.position));
const guiinSet = (o: any) => Object.values(o ?? {}).flat().map((x: any) => `${x.name}@${x.position}`).sort();
eq("guiin", guiinSet(local.guiin), guiinSet(ref?.guiin));

// 대운
eq("daeun.direction/start", [local.daeun.direction, local.daeun.daeun_start_age], [ref?.daeun?.direction, ref?.daeun?.daeun_start_age]);
eq("daeun.current_daeun.ganji", local.daeun.current_daeun?.ganji, ref?.daeun?.current_daeun?.ganji);
eq("daeun.all(간지/나이)", local.daeun.all_daeun.map((x: any) => [x.age_start, x.ganji, x.ganji_hanja, x.sipseong?.gan, x.sipseong?.ji, x.twelveFortune?.fortune]),
   ref?.daeun?.all_daeun?.map((x: any) => [x.age_start, x.ganji, x.ganji_hanja, x.sipseong?.gan, x.sipseong?.ji, x.twelveFortune?.fortune]));

// 세운 — 2026~2030 (기준 파일 생성 시점과 무관하게 연도로 대조)
const flat = (s: any) => [s?.currentSeun, s?.nextSeun, ...(s?.upcomingSeuns ?? []), ...(s?.recentSeuns ?? [])].filter(Boolean);
const seunBy = (s: any) => Object.fromEntries(flat(s).map((x: any) => [Number(x.year), x]));
const ls = seunBy(local.seun), rs = seunBy(ref?.seun);
for (let yy = 2026; yy <= 2030; yy++) {
  const a = ls[yy], b = rs[yy];
  if (!a) { issues.push(`세운 ${yy} 로컬 없음`); continue; }
  eq(`세운 ${yy}`, [a.ganji, a.age, a.sipseongRelation?.gan, a.sipseongRelation?.ji, a.twelveFortune?.fortune],
     b ? [b.ganji, b.age, b.sipseongRelation?.gan, b.sipseongRelation?.ji, b.twelveFortune?.fortune] : "(기준 없음)");
}

if (issues.length) {
  console.log(`불일치/누락 ${issues.length}건:`);
  for (const i of issues) console.log(" -", i);
  process.exit(1);
}
console.log("어댑터 점검 통과 — 모든 소비 경로 존재, 기준 응답과 값 일치");
