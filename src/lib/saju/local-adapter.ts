// =====================================================
// 로컬 만세력 → luckyloveme 응답 형태 어댑터
// =====================================================
// local-analysis 의 계산 결과를 luckyloveme saju-full-analysis 응답과
// 같은 모양(SajuAnalysisResponse)으로 감싼다.
// 인생 사주(life-report) 등 luckyloveme 응답 형태를 그대로 소비하는
// 코드가 API 없이도 동작하도록 하는 폴백/전환용 레이어.
//
// 모양 차이 보정 목록:
//  - ganji 기둥: {gan, ji} → 한자·오행·음양 필드 추가, hour null → 필드 생략
//  - daeun: current_daeun/next_daeun 파생, all_daeun[].twelveFortune 문자열 → 객체
//  - seun: 각 항목의 twelveFortune 문자열 → {fortune} 객체

import {
  computeLocalAnalysisWithGender,
  computeUnHapChung,
  computeUnYongsinSet,
  judgeUn,
  type LocalAnalysis,
} from "@/lib/saju/local-analysis";
import {
  SIPSEONG_TYPE,
  sipseongMeaning,
  sipseongAnalysis,
  TWELVE_FORTUNE_INTERP,
  TWELVE_FORTUNE_EXTRA,
  iljiAnalysisOf,
  yeokmaDetail,
  sinStrengthAnalysis,
  sinStrengthQualitative,
  naegeokDetail,
  GUIIN_DESC,
  SINSAL_MEANING,
  SIBISINSAL_DESC,
  bigyeonGeobjaeMeaning,
  bigyeonGeobjaeAnalysis,
  unInterpretation,
  cheonganHapInfo,
  daeunMeta,
} from "@/lib/saju/local-prose";
import type { SajuAnalysisResponse } from "@/lib/saju/saju-api";

/* eslint-disable @typescript-eslint/no-explicit-any */

const GAN_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
const JI_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};
const GAN_OH: Record<string, string> = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
const JI_OH: Record<string, string> = { 자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수" };
const GAN_YANG: Record<string, boolean> = { 갑: true, 을: false, 병: true, 정: false, 무: true, 기: false, 경: true, 신: false, 임: true, 계: false };
const JI_YANG: Record<string, boolean> = { 자: true, 축: false, 인: true, 묘: false, 진: true, 사: false, 오: true, 미: false, 신: true, 유: false, 술: true, 해: false };

function wrapPillar(p: { gan: string; ji: string }) {
  const gh = GAN_HANJA[p.gan] ?? p.gan;
  const jh = JI_HANJA[p.ji] ?? p.ji;
  return {
    gan: p.gan,
    ji: p.ji,
    ganji: `${p.gan}${p.ji}(${gh}${jh})`,
    ganHanja: gh,
    jiHanja: jh,
    fullHangul: `${p.gan}${p.ji}`,
    fullHanja: `${gh}${jh}`,
    eumyang: { gan: GAN_YANG[p.gan] ? "양" : "음", ji: JI_YANG[p.ji] ? "양" : "음" },
    ohaeng: { gan: GAN_OH[p.gan], ji: JI_OH[p.ji] },
  };
}

export type LocalFullInput = {
  birthDate: string;             // "YYYY-MM-DD"
  birthTime: string | null;      // "HH:mm"
  timeUnknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
};

export function computeLocalFullAnalysis(input: LocalFullInput, now: Date = new Date()): SajuAnalysisResponse {
  const [y, m, d] = input.birthDate.split("-");
  const hasTime = !input.timeUnknown && !!input.birthTime;
  const [hh, mm] = hasTime ? input.birthTime!.split(":") : [undefined, undefined];

  const local: LocalAnalysis = computeLocalAnalysisWithGender({
    birthYear: y,
    birthMonth: String(parseInt(m, 10)),
    birthDay: String(parseInt(d, 10)),
    ...(hasTime ? { birthHour: String(parseInt(hh!, 10)), birthMinute: String(parseInt(mm!, 10)) } : {}),
    calendarType: input.calendar === "lunar" ? "음력" : "양력",
    gender: input.gender,
  }, now);

  // 기둥 래핑 (시주 없으면 hour 필드 생략 — luckyloveme 와 동일)
  const g = local.ganji;
  const ganji: any = {
    year: wrapPillar(g.year),
    month: wrapPillar(g.month),
    day: wrapPillar(g.day),
    ...(g.hour ? { hour: wrapPillar(g.hour) } : {}),
  };

  // 대운 — 12운성 객체화 + current/next 파생
  const allDaeun = local.daeun.all_daeun.map((x) => ({
    ...x,
    twelveFortune: { fortune: x.twelveFortune },
  }));
  const curAge = local.daeun.current_age;
  const curIdx = allDaeun.findIndex((x) => curAge >= x.age_start && curAge <= x.age_end);
  const daeun: any = {
    ...local.daeun,
    all_daeun: allDaeun,
    current_daeun: curIdx >= 0 ? allDaeun[curIdx] : allDaeun[0],
    next_daeun: curIdx >= 0 && curIdx + 1 < allDaeun.length ? allDaeun[curIdx + 1] : null,
  };

  // 세운/월운 — 12운성 객체화
  // 세운/월운 판정 셋 — 원국과 별도 재판정 (luckyloveme 실측 규칙)
  const unSet = computeUnYongsinSet(local);
  const wrapSeun = (s: any) => ({
    ...s,
    // 세운 12운성은 API 처럼 위치·간지를 포함한 객체 + 해석
    twelveFortune: {
      position: "세운", gan: s.gan, ji: s.ji, fortune: s.twelveFortune,
      interpretation: TWELVE_FORTUNE_INTERP[s.twelveFortune]
        ? { ...TWELVE_FORTUNE_INTERP[s.twelveFortune], ...TWELVE_FORTUNE_EXTRA[s.twelveFortune] }
        : null,
    },
    hapChungRelations: computeUnHapChung(s.gan, s.ji, local.ganji, "세운"),
    yongsinJudgment: judgeUn(s.gan, s.ji, unSet, local.ganji, "세운"),
  });
  const seun: any = {
    currentSeun: wrapSeun(local.seun.currentSeun),
    nextSeun: wrapSeun(local.seun.nextSeun),
    recentSeuns: local.seun.recentSeuns.map(wrapSeun),
    upcomingSeuns: local.seun.upcomingSeuns.map(wrapSeun),
  };

  // 월운 — 판정만 추가 (luckyloveme 는 월운에 합충 목록을 노출하지 않음)
  const wrapWeolun = (w: any) => ({ ...w, yongsinJudgment: judgeUn(w.gan, w.ji, unSet, local.ganji, "월운") });
  const weolun: any = {
    currentWeolun: wrapWeolun(local.weolun.currentWeolun),
    nextWeolun: wrapWeolun(local.weolun.nextWeolun),
    recentWeoluns: local.weolun.recentWeoluns.map(wrapWeolun),
    upcomingWeoluns: local.weolun.upcomingWeoluns.map(wrapWeolun),
  };

  // ── 해설 문장 주입 (local-prose 자체 템플릿 — API 문장 복사 아님) ──
  // 십성: 정/편 + 위치별 의미 + 총평 + 천간합 구조
  const sipseong: any = {
    ...local.sipseong,
    sipseongs: local.sipseong.sipseongs.map((s) => ({
      ...s, type: SIPSEONG_TYPE[s.sipseong], meaning: sipseongMeaning(s.position, s.sipseong),
    })),
    analysis: sipseongAnalysis(local.sipseong.summary as any),
    cheonganHap: cheonganHapInfo(local.ganji),
  };
  // 12운성: 운성별 해석 객체 + 일지 분석
  const fortuneInterp = (name: string) =>
    TWELVE_FORTUNE_INTERP[name] ? { ...TWELVE_FORTUNE_INTERP[name], ...TWELVE_FORTUNE_EXTRA[name] } : null;
  const iljiFortune = local.twelveFortune.fortunes.find((f) => f.position === "일지");
  const twelveFortune: any = {
    ...local.twelveFortune,
    fortunes: local.twelveFortune.fortunes.map((f) => ({
      ...f, interpretation: fortuneInterp(f.fortune),
    })),
    iljiAnalysis: iljiFortune ? iljiAnalysisOf(iljiFortune.fortune) : "",
  };
  // 신강/신약: 총평 + 정성 유형
  const qualitative = sinStrengthQualitative(local.sinStrength);
  const sinStrength: any = {
    ...local.sinStrength,
    analysis: sinStrengthAnalysis(local.sinStrength),
    qualitativeType: qualitative.type,
    qualitativeAnalysis: qualitative.analysis,
  };
  // 격국: 내격 상세
  const gyeokguk: any = {
    ...local.gyeokguk,
    naegeokDetail: naegeokDetail(local.ganji, local.ganji.day.gan, local.gyeokguk),
    종합설명: local.gyeokguk.reason,
  };
  // 귀인·신살: 항목별 한 줄 설명
  const guiin: any = Object.fromEntries(Object.entries(local.guiin as Record<string, any[]>).map(([k, list]) => [
    k, (list ?? []).map((x: any) => ({ ...x, description: GUIIN_DESC[k] ?? "" })),
  ]));
  const withMeaning = (list: any[], key: string) => (list ?? []).map((x: any) => ({ ...x, meaning: SINSAL_MEANING[key] }));
  const dohwa: any = { dohwa: withMeaning(local.dohwa.dohwa, "도화") };
  const hongyeom: any = { hongyeom: withMeaning(local.hongyeom.hongyeom, "홍염") };
  const hwagae: any = { hwagae: withMeaning(local.hwagae.hwagae, "화개") };
  const sibisinsals: any = {
    sibisinsals: local.sibisinsals.sibisinsals.map((x) => ({ ...x, description: SIBISINSAL_DESC[x.name] ?? "" })),
    yeokma: yeokmaDetail(local.ganji),
  };
  // 비견/겁재: 항목 의미 + 총평
  const bg = local.bigyeonGeobjae;
  const bigyeonGeobjae: any = {
    ...bg,
    bigyeon: bg.bigyeon.map((x: any) => ({ ...x, type: "비견", meaning: bigyeonGeobjaeMeaning("비견", x.position) })),
    geobjae: bg.geobjae.map((x: any) => ({ ...x, type: "겁재", meaning: bigyeonGeobjaeMeaning("겁재", x.position) })),
    analysis: bigyeonGeobjaeAnalysis(bg.bigyeonCount, bg.geobjaeCount),
  };
  // 세운/월운: 항목별 해석 문장
  const addSeunInterp = (s: any) => ({
    ...s, interpretation: unInterpretation("해", s.sipseongRelation?.gan, s.twelveFortune?.fortune, s.yongsinJudgment?.종합판정),
  });
  const addWeolunInterp = (w: any) => ({
    ...w, interpretation: unInterpretation("달", w.sipseongRelation?.gan, undefined, w.yongsinJudgment?.종합판정),
  });
  for (const k of ["currentSeun", "nextSeun"]) seun[k] = addSeunInterp(seun[k]);
  seun.recentSeuns = seun.recentSeuns.map(addSeunInterp);
  seun.upcomingSeuns = seun.upcomingSeuns.map(addSeunInterp);
  for (const k of ["currentWeolun", "nextWeolun"]) weolun[k] = addWeolunInterp(weolun[k]);
  weolun.recentWeoluns = weolun.recentWeoluns.map(addWeolunInterp);
  weolun.upcomingWeoluns = weolun.upcomingWeoluns.map(addWeolunInterp);

  return {
    ...local,
    ganji,
    sipseong,
    twelveFortune,
    sinStrength,
    gyeokguk,
    guiin,
    dohwa,
    hongyeom,
    hwagae,
    sibisinsals,
    bigyeonGeobjae,
    daeun: { ...daeun, ...daeunMeta(input, local.ganji) },
    seun,
    weolun,
  } as SajuAnalysisResponse;
}
