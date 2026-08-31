// =====================================================
// 로컬 만세력 2단계 — 파생 항목(십성·12운성·신살·대운·세운·월운 등)
// =====================================================
// luckyloveme 16종 응답의 "계산 가능한 사실"을 로컬로 재현한다.
// 설명문(prose)은 외부 저작물이라 복사하지 않고 자체 요약 문구를 쓰거나 생략.
// scripts/golden-analysis.ts 로 사실 필드를 API와 대조 검증한다.

import { Solar, Lunar } from "lunar-typescript";
import { computeLocalGanji, resolveBirth, dstMinutes, type LocalGanjiInput, type LocalGanji } from "./local-ganji";

// ── 기본 테이블 ──────────────────────────────────────
const GANS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
const JIS = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

const GAN_HANJA: Record<string, string> = { 갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸" };
const JI_HANJA: Record<string, string> = { 자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥" };

// 오행: 목화토금수
const GAN_ELEM: Record<string, string> = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
const JI_ELEM: Record<string, string> = { 자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수" };

// 음양 (+ = 양). 십성 판정 시 자·오·사·해는 체용 전환 적용
const GAN_YANG: Record<string, boolean> = { 갑: true, 을: false, 병: true, 정: false, 무: true, 기: false, 경: true, 신: false, 임: true, 계: false };
const JI_YANG_NATURAL: Record<string, boolean> = { 자: true, 축: false, 인: true, 묘: false, 진: true, 사: false, 오: true, 미: false, 신: true, 유: false, 술: true, 해: false };
const JI_YANG_FOR_SIPSEONG: Record<string, boolean> = { ...JI_YANG_NATURAL, 자: false, 해: true, 사: true, 오: false };

// 상생: key 가 value 를 생함
const SAENG: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
// 상극: key 가 value 를 극함
const GEUK: Record<string, string> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export type PillarKey = "year" | "month" | "day" | "hour";
const GAN_POS: Record<PillarKey, string> = { year: "년간", month: "월간", day: "일간", hour: "시간" };
const JI_POS: Record<PillarKey, string> = { year: "년지", month: "월지", day: "일지", hour: "시지" };
const PILLAR_POS: Record<PillarKey, string> = { year: "년주", month: "월주", day: "일주", hour: "시주" };
const PILLARS: PillarKey[] = ["year", "month", "day", "hour"];

// ── 십성 ────────────────────────────────────────────
export function sipseongOf(dayGan: string, elem: string, yang: boolean): string {
  const dElem = GAN_ELEM[dayGan];
  const dYang = GAN_YANG[dayGan];
  const same = yang === dYang;
  if (elem === dElem) return same ? "비견" : "겁재";
  if (SAENG[dElem] === elem) return same ? "식신" : "상관";
  if (GEUK[dElem] === elem) return same ? "편재" : "정재";
  if (GEUK[elem] === dElem) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}

export function sipseongOfGan(dayGan: string, gan: string): string {
  return sipseongOf(dayGan, GAN_ELEM[gan], GAN_YANG[gan]);
}
export function sipseongOfJi(dayGan: string, ji: string): string {
  return sipseongOf(dayGan, JI_ELEM[ji], JI_YANG_FOR_SIPSEONG[ji]);
}

const SIPSEONG_CATEGORY: Record<string, string> = {
  비견: "비겁성", 겁재: "비겁성", 식신: "식상성", 상관: "식상성",
  편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
};

// ── 12운성 (화토동법: 무=병, 기=정) ─────────────────
const TWELVE_FORTUNE_NAMES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
const JANGSAENG_JI: Record<string, string> = {
  갑: "해", 병: "인", 무: "인", 경: "사", 임: "신",
  을: "오", 정: "유", 기: "유", 신: "자", 계: "묘",
};
export function twelveFortuneOf(dayGan: string, ji: string): string {
  const start = JIS.indexOf(JANGSAENG_JI[dayGan] as typeof JIS[number]);
  const idx = JIS.indexOf(ji as typeof JIS[number]);
  const step = GAN_YANG[dayGan] ? (idx - start + 12) % 12 : (start - idx + 12) % 12;
  return TWELVE_FORTUNE_NAMES[step];
}

// ── 60갑자 유틸 ─────────────────────────────────────
function ganjiOfYear(year: number): { gan: string; ji: string } {
  return { gan: GANS[((year - 4) % 10 + 10) % 10], ji: JIS[((year - 4) % 12 + 12) % 12] };
}
function stepGanji(gan: string, ji: string, step: number): { gan: string; ji: string } {
  const gi = (GANS.indexOf(gan as typeof GANS[number]) + step % 10 + 10) % 10;
  const ji2 = (JIS.indexOf(ji as typeof JIS[number]) + step % 12 + 12) % 12;
  return { gan: GANS[gi], ji: JIS[ji2] };
}

// ── 신살 · 귀인 테이블 ───────────────────────────────
// 삼합 그룹 (년지 기준 12신살 등)
const SAMHAP_GROUP: Record<string, string> = {
  신: "수", 자: "수", 진: "수",
  인: "화", 오: "화", 술: "화",
  사: "금", 유: "금", 축: "금",
  해: "목", 묘: "목", 미: "목",
};
// 그룹별 겁살 시작 지지 (겁살→재살→천살→지살→년살→월살→망신살→장성살→반안살→역마살→육해살→화개살)
const GEOPSAL_START: Record<string, string> = { 수: "사", 화: "해", 금: "인", 목: "신" };
const SIBISINSAL_NAMES = ["겁살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"];
export function sibisinsalOf(baseJi: string, targetJi: string): string {
  const start = GEOPSAL_START[SAMHAP_GROUP[baseJi]];
  const step = (JIS.indexOf(targetJi as typeof JIS[number]) - JIS.indexOf(start as typeof JIS[number]) + 12) % 12;
  return SIBISINSAL_NAMES[step];
}

// 홍염살 (일간 → 지지)
const HONGYEOM: Record<string, string[]> = {
  갑: ["오"], 을: ["오"], 병: ["인"], 정: ["미"], 무: ["진"],
  기: ["진"], 경: ["신"], 신: ["유"], 임: ["자", "신"], 계: ["신"],
};

// 귀인 테이블 (일간 → 지지 목록)
const CHEONEUL: Record<string, string[]> = {
  갑: ["축", "미"], 무: ["축", "미"], 경: ["축", "미"],
  을: ["자", "신"], 기: ["자", "신"],
  병: ["해", "유"], 정: ["해", "유"],
  신: ["인", "오"], 임: ["사", "묘"], 계: ["사", "묘"],
};
// 태극귀인 — API 실측 피팅: 병정은 고전(묘유)과 달리 인묘를 쓴다. 년지·일지만 검사.
const TAEGEUK: Record<string, string[]> = {
  갑: ["자", "오"], 을: ["자", "오"], 병: ["인", "묘"], 정: ["인", "묘"],
  무: ["진", "술"], 기: ["축", "미"],
  경: ["인", "해"], 신: ["인", "해"], 임: ["사", "신"], 계: ["사", "신"],
};
const MUNCHANG: Record<string, string> = { 갑: "사", 을: "오", 병: "신", 무: "신", 정: "유", 기: "유", 경: "해", 신: "자", 임: "인", 계: "묘" };
const MUNGOK: Record<string, string> = { 갑: "해", 을: "자", 병: "인", 무: "인", 정: "묘", 기: "묘", 경: "사", 신: "오", 임: "신", 계: "유" };
// 복성귀인 — API 실측 피팅: 갑을병은 고전표(인·축·자)와 역순표(자·해·술) 값을 모두 인정
const BOKSEONG: Record<string, string[]> = {
  갑: ["인", "자"], 을: ["축", "해"], 병: ["자", "술"],
  정: ["유"], 무: ["신"], 기: ["미"], 경: ["오"], 신: ["사"], 임: ["진"], 계: ["묘"],
};
const CHEONJU: Record<string, string> = { 갑: "사", 을: "오", 병: "사", 정: "오", 무: "신", 기: "유", 경: "해", 신: "자", 임: "인", 계: "묘" };
// 천관귀인 — API 실측 피팅: 경→오, 임→축·미 확인 (임→술 반증)
const CHEONGWAN: Record<string, string[]> = { 갑: ["유"], 을: ["신"], 병: ["자"], 정: ["해"], 무: ["묘"], 기: ["인"], 경: ["오"], 신: ["사"], 임: ["축", "미"], 계: ["진"] };
const CHEONBOK: Record<string, string> = { 갑: "미", 을: "진", 병: "사", 정: "유", 무: "술", 기: "묘", 경: "해", 신: "신", 임: "인", 계: "오" };
// 학당 = 일간 장생지
const GEUMYEO: Record<string, string> = { 갑: "진", 을: "사", 병: "미", 정: "신", 무: "미", 기: "신", 경: "술", 신: "해", 임: "축", 계: "인" };
// 유하 — 변형표 (壬亥·癸寅). API 실측: 경→진, 임→해 확인
const YUHA: Record<string, string> = { 갑: "유", 을: "술", 병: "미", 정: "신", 무: "사", 기: "오", 경: "진", 신: "묘", 임: "해", 계: "인" };
// 재고귀인 — API 실측 피팅: 갑을→진 확인, 무기는 미표기
const JAEGO: Record<string, string[]> = {
  갑: ["진"], 을: ["진"], 병: ["축"], 정: ["축"],
  무: [], 기: [], 경: ["미"], 신: ["미"], 임: ["술"], 계: ["술"],
};
// 록지 (건록)
const ROK: Record<string, string> = { 갑: "인", 을: "묘", 병: "사", 정: "오", 무: "사", 기: "오", 경: "신", 신: "유", 임: "해", 계: "자" };
// 천간합 (합화 오행)
const CHEONGAN_HAP: [string, string, string][] = [
  ["갑", "기", "토"], ["을", "경", "금"], ["병", "신", "수"], ["정", "임", "목"], ["무", "계", "화"],
];
// 천덕귀인 (월지 → 대상 글자 + 간/지 구분 — 묘·오·유·자월은 지지가 대상)
const CHEONDEOK: Record<string, { char: string; kind: "gan" | "ji" }> = {
  인: { char: "정", kind: "gan" }, 묘: { char: "신", kind: "ji" }, 진: { char: "임", kind: "gan" },
  사: { char: "신", kind: "gan" }, 오: { char: "해", kind: "ji" }, 미: { char: "갑", kind: "gan" },
  신: { char: "계", kind: "gan" }, 유: { char: "인", kind: "ji" }, 술: { char: "병", kind: "gan" },
  해: { char: "을", kind: "gan" }, 자: { char: "사", kind: "ji" }, 축: { char: "경", kind: "gan" },
};
// 월덕귀인 (월지 삼합국 → 간)
const WOLDEOK: Record<string, string> = { 수: "임", 화: "병", 금: "경", 목: "갑" };

// ── 지장간 (여기·중기·정기, 30일 배분) ────────────────
const JIJANGGAN: Record<string, [string, number][]> = {
  자: [["임", 10], ["계", 20]], 축: [["계", 9], ["신", 3], ["기", 18]], 인: [["무", 7], ["병", 7], ["갑", 16]],
  묘: [["갑", 10], ["을", 20]], 진: [["을", 9], ["계", 3], ["무", 18]], 사: [["무", 7], ["경", 7], ["병", 16]],
  오: [["병", 10], ["기", 9], ["정", 11]], 미: [["정", 9], ["을", 3], ["기", 18]], 신: [["무", 7], ["임", 7], ["경", 16]],
  유: [["경", 10], ["신", 20]], 술: [["신", 9], ["정", 3], ["무", 18]], 해: [["무", 7], ["갑", 7], ["임", 16]],
};

/** 지장간 통근 등급 — luckyloveme 실측 표기.
 *  진·술·축·미·오는 통설과 여기/중기가 반대라서 별도 표로 고정한다
 *  (실측 480기둥 전건 일치, scripts/probe-strength.ts 응답의 supportElements 기준). */
const TONGGEUN_GRADE: Record<string, Record<string, "여기" | "중기" | "본기">> = {
  자: { 임: "여기", 계: "본기" },
  축: { 신: "여기", 계: "중기", 기: "본기" },
  인: { 무: "여기", 병: "중기", 갑: "본기" },
  묘: { 갑: "여기", 을: "본기" },
  진: { 계: "여기", 을: "중기", 무: "본기" },
  사: { 무: "여기", 경: "중기", 병: "본기" },
  오: { 기: "여기", 병: "중기", 정: "본기" },
  미: { 을: "여기", 정: "중기", 기: "본기" },
  신: { 무: "여기", 임: "중기", 경: "본기" },
  유: { 경: "여기", 신: "본기" },
  술: { 정: "여기", 신: "중기", 무: "본기" },
  해: { 무: "여기", 갑: "중기", 임: "본기" },
};

/** 신강 점수 배점 — luckyloveme 실측 산식 (총점 100점 만점).
 *  천간: 비겁·인성일 때만 가산, 일간은 자기 자신이라 제외.
 *  지지: 통근한 지장간의 등급으로 가산 (본기 > 중기 > 여기 우선). */
const SIN_GAN_SCORE: Record<PillarKey, number> = { year: 10, month: 15, day: 0, hour: 10 };
const SIN_JI_SCORE: Record<PillarKey, Record<"여기" | "중기" | "본기", number>> = {
  year: { 본기: 10, 중기: 5, 여기: 3 },
  month: { 본기: 25, 중기: 13, 여기: 8 },
  day: { 본기: 20, 중기: 10, 여기: 6 },
  hour: { 본기: 10, 중기: 5, 여기: 3 },
};

/** 지지의 통근 등급 — 비겁·인성에 해당하는 지장간 중 가장 높은 등급 (없으면 무근) */
function tonggeunGrade(ji: string, isHelpElem: (elem: string) => boolean): "여기" | "중기" | "본기" | null {
  const table = TONGGEUN_GRADE[ji] ?? {};
  for (const want of ["본기", "중기", "여기"] as const) {
    const hidden = Object.keys(table).find((h) => table[h] === want);
    if (hidden && isHelpElem(GAN_ELEM[hidden])) return want;
  }
  return null;
}

/** 오행별 세력 — 지장간 배분 가중 합 (격국 억부 과다 판정용).
 *  간 — 년1 월2 일1 시1 / 지 — 년1 월3 일3 시2 */
const GAN_WEIGHT: Record<PillarKey, number> = { year: 1, month: 2, day: 1, hour: 1 };
const JI_WEIGHT: Record<PillarKey, number> = { year: 1, month: 3, day: 3, hour: 2 };
function elementPowers(ganji: LocalGanji): Record<string, number> {
  const powers: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of PILLARS) {
    if (p === "hour" && !ganji.hour) continue;
    powers[GAN_ELEM[ganji[p]!.gan]] += GAN_WEIGHT[p];
    const hidden = JIJANGGAN[ganji[p]!.ji];
    const total = hidden.reduce((a, [, d]) => a + d, 0);
    for (const [hg, d] of hidden) powers[GAN_ELEM[hg]] += JI_WEIGHT[p] * (d / total);
  }
  return powers;
}

// ── 지지 관계 (합충형해파) ───────────────────────────
const YUKHAP: [string, string][] = [["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"]];
const CHUNG: [string, string][] = [["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]];
const PA: [string, string][] = [["자", "유"], ["오", "묘"], ["사", "신"], ["인", "해"], ["진", "축"], ["술", "미"]];
const WONJIN: [string, string][] = [["자", "미"], ["축", "오"], ["인", "유"], ["묘", "신"], ["진", "해"], ["사", "술"]];
const HAE: [string, string][] = [["자", "미"], ["축", "오"], ["인", "사"], ["묘", "진"], ["신", "해"], ["유", "술"]];
// 삼합 [지1, 왕지, 지3, 오행]
const SAMHAP: [string, string, string, string][] = [
  ["신", "자", "진", "수"], ["인", "오", "술", "화"], ["사", "유", "축", "금"], ["해", "묘", "미", "목"],
];
// 방합 [지1, 지2, 지3, 방위+오행]
const BANGHAP: [string, string, string, string][] = [
  ["인", "묘", "진", "동방목"], ["사", "오", "미", "남방화"], ["신", "유", "술", "서방금"], ["해", "자", "축", "북방수"],
];
// 형 (삼형 + 상형 + 자형)
const HYEONG_PAIRS: [string, string][] = [
  ["인", "사"], ["사", "신"], ["인", "신"],
  ["축", "술"], ["술", "미"], ["축", "미"],
  ["자", "묘"],
  ["진", "진"], ["오", "오"], ["유", "유"], ["해", "해"],
];

// ── 계산 결과 타입 (API 응답과 동일 골격, 사실 위주) ──
type Positioned = { position: string; ji: string; name: string; description?: string };

export type LocalAnalysis = {
  ganji: LocalGanji;
  sipseong: {
    sipseongs: { position: string; ganji: string; sipseong: string; category: string }[];
    summary: { bigyeop: number; siksang: number; jaeseong: number; gwanseong: number; inseong: number };
  };
  twelveFortune: { dayGan: string; fortunes: { position: string; gan: string; ji: string; fortune: string }[]; summary: string };
  sinStrength: {
    isStrong: boolean; strength: string; level: number; score: number;
    bigyeopCount: number; inseongCount: number;
    deukryeong: boolean; deukji: boolean; deukse: boolean; description: string;
    wolryeong: string;
    detailAnalysis: {
      scoreBreakdown: Record<string, number>;
      supportElements: string[];
      weakenElements: string[];
    };
  };
  gyeokguk: {
    type: string; name: string; reason: string;
    yongsin: { 십신: string; 오행: string; method: string; reason: string };
    희신오행: string; 기신오행: string; 구신오행: string;
    신강여부: boolean; 신강점수: number;
  };
  guiin: Record<string, Positioned[]>;
  hongyeom: { hongyeom: Positioned[] };
  dohwa: { dohwa: (Positioned & { type: string })[] };
  hwagae: { hwagae: (Positioned & { type: string })[] };
  sibisinsals: { sibisinsals: Positioned[] };
  bigyeonGeobjae: {
    bigyeon: { position: string; ganji: string; name: string }[];
    geobjae: { position: string; ganji: string; name: string }[];
    bigyeonCount: number; geobjaeCount: number; totalCount: number;
  };
  hapchung: { type: string; source: string; target: string; sourcePosition: string; targetPosition: string; meaning: string }[];
  daeun: {
    year_ganji: string; is_yang_gan: boolean; direction: "순행" | "역행";
    daeun_start_age: number; daeun_start_date: string; current_age: number;
    all_daeun: { sequence: number; age_start: number; age_end: number; ganji: string; ganji_hanja: string; start_date: string; year_start: number; year_end: number; sipseong: { gan: string; ji: string }; twelveFortune: string }[];
  };
  seun: {
    currentSeun: SeunItem; nextSeun: SeunItem; recentSeuns: SeunItem[]; upcomingSeuns: SeunItem[];
  };
  weolun: {
    currentWeolun: WeolunItem; nextWeolun: WeolunItem; recentWeoluns: WeolunItem[]; upcomingWeoluns: WeolunItem[];
  };
};

export type SeunItem = {
  year: number; age: number; ganji: string; ganji_hanja: string; gan: string; ji: string;
  ganElement: string; jiElement: string;
  sipseongRelation: { gan: string; ji: string };
  twelveFortune: string;
};
export type WeolunItem = {
  year: number; month: number; monthLabel: string; isCurrentMonth: boolean;
  ganji: string; ganji_hanja: string; gan: string; ji: string;
  ganElement: string; jiElement: string;
  sipseongRelation: { gan: string; ji: string };
};

function hanja(gan: string, ji: string): string {
  return `${GAN_HANJA[gan]}${JI_HANJA[ji]}`;
}

// ── 메인 ────────────────────────────────────────────
export function computeLocalAnalysis(input: LocalGanjiInput, now: Date = new Date()): LocalAnalysis {
  const ganji = computeLocalGanji(input);
  const dayGan = ganji.day.gan;
  const resolved = resolveBirth(input);

  // 간·지 위치 나열 (일간 제외한 십성 대상 7자리)
  const ganEntries = PILLARS
    .filter((p) => p !== "day" && (p !== "hour" || ganji.hour))
    .map((p) => ({ position: GAN_POS[p], char: ganji[p]!.gan, kind: "gan" as const }));
  const jiEntries = PILLARS
    .filter((p) => p !== "hour" || ganji.hour)
    .map((p) => ({ position: JI_POS[p], char: ganji[p]!.ji, kind: "ji" as const }));

  // ── 십성 ──
  // 천간합화 변환은 적용하지 않는다. 실측 250건 중 인접 천간합이 있는 113건을 대조한 결과
  // API 가 실제로 합화 오행으로 바꿔 십성을 낸 건 8건(7%)뿐이고, 월령·쟁합·일간 참여
  // 어느 조건으로도 그 8건이 갈리지 않았다. 무변환이 250건 중 242건(97%) 일치로 가장 정확하다.
  const effElem: Partial<Record<PillarKey, string>> = {};
  const sipseongs = [
    ...PILLARS.filter((p) => p !== "hour" || ganji.hour).flatMap((p) => {
      const out: { position: string; ganji: string; sipseong: string; category: string }[] = [];
      if (p !== "day") {
        const gan = ganji[p]!.gan;
        const s = sipseongOf(dayGan, effElem[p] ?? GAN_ELEM[gan], GAN_YANG[gan]);
        out.push({ position: GAN_POS[p], ganji: gan, sipseong: s, category: SIPSEONG_CATEGORY[s] });
      }
      const sj = sipseongOfJi(dayGan, ganji[p]!.ji);
      out.push({ position: JI_POS[p], ganji: ganji[p]!.ji, sipseong: sj, category: SIPSEONG_CATEGORY[sj] });
      return out;
    }),
  ];
  // API 정렬: 년간, 년지, 월간, 월지, 일지, 시간, 시지
  const posOrder = ["년간", "년지", "월간", "월지", "일지", "시간", "시지"];
  sipseongs.sort((a, b) => posOrder.indexOf(a.position) - posOrder.indexOf(b.position));
  const summary = { bigyeop: 0, siksang: 0, jaeseong: 0, gwanseong: 0, inseong: 0 };
  for (const s of sipseongs) {
    if (s.category === "비겁성") summary.bigyeop++;
    else if (s.category === "식상성") summary.siksang++;
    else if (s.category === "재성") summary.jaeseong++;
    else if (s.category === "관성") summary.gwanseong++;
    else summary.inseong++;
  }

  // ── 12운성 (4주) ──
  const fortunes = PILLARS.filter((p) => p !== "hour" || ganji.hour).map((p) => ({
    position: PILLAR_POS[p],
    gan: ganji[p]!.gan,
    ji: ganji[p]!.ji,
    fortune: twelveFortuneOf(dayGan, ganji[p]!.ji),
  }));

  // ── 신강/신약 ──
  const isHelp = (s: string) => s === "비견" || s === "겁재" || s === "편인" || s === "정인";
  const wolji = sipseongOfJi(dayGan, ganji.month.ji);
  const ilji = sipseongOfJi(dayGan, ganji.day.ji);
  const deukryeong = isHelp(wolji);
  const deukji = isHelp(ilji);
  // 득세는 합화 변환 전(원본) 십성 기준 — 월지·일지 제외 5자리 중 비겁/인성 3개 이상
  const rawOthers = [
    ...PILLARS.filter((p) => p !== "day" && (p !== "hour" || ganji.hour)).map((p) => sipseongOfGan(dayGan, ganji[p]!.gan)),
    ...PILLARS.filter((p) => (p === "year" || (p === "hour" && ganji.hour))).map((p) => sipseongOfJi(dayGan, ganji[p]!.ji)),
  ];
  const helpers = rawOthers.filter((s) => isHelp(s)).length;
  const deukse = helpers >= 3;
  const bigyeopCount = sipseongs.filter((s) => s.category === "비겁성").length;
  const inseongCount = sipseongs.filter((s) => s.category === "인성").length;
  const deukCount = [deukryeong, deukji, deukse].filter(Boolean).length;
  // 점수 — luckyloveme 실측 산식 재현 (120샘플 총점 120/120, 기둥별 480/480 일치)
  const powers = elementPowers(ganji);
  const beElem = GAN_ELEM[dayGan];
  const ieElem = (Object.keys(SAENG) as string[]).find((k) => SAENG[k] === beElem)!;
  const isHelpElem = (elem: string) => elem === beElem || elem === ieElem;
  let score = 0;
  const scoreBreakdown: Record<string, number> = { year: 0, month: 0, day: 0, hour: 0 };
  const supportElements: string[] = [];
  const weakenElements: string[] = [];
  for (const p of PILLARS) {
    // 시주 미상이면 API 는 시주 몫으로 중간값 10점을 고정 가산한다 (실측 30/30)
    if (p === "hour" && !ganji.hour) {
      score += 10; scoreBreakdown.hour = 10;
      supportElements.push("시주: 미상 → 중간값 적용");
      continue;
    }
    let pts = 0;
    if (p !== "day") {
      const ge = GAN_ELEM[ganji[p]!.gan];
      if (isHelpElem(ge)) {
        pts += SIN_GAN_SCORE[p];
        supportElements.push(`${GAN_POS[p]}: ${ge} → ${ge === beElem ? "비겁(동료 기운)" : "인성(지원 기운)"}`);
      } else {
        weakenElements.push(`${GAN_POS[p]}: ${ge} → ${SIPSEONG_CATEGORY[sipseongOfGan(dayGan, ganji[p]!.gan)]}`);
      }
    }
    const grade = tonggeunGrade(ganji[p]!.ji, isHelpElem);
    if (grade) {
      pts += SIN_JI_SCORE[p][grade];
      const table = TONGGEUN_GRADE[ganji[p]!.ji];
      const hidden = Object.keys(table).find((h) => table[h] === grade)!;
      const he = GAN_ELEM[hidden];
      supportElements.push(`${JI_POS[p]}: ${ganji[p]!.ji}(${hidden}·${he}) → ${grade} 통근(${he === beElem ? "비겁" : "인성"})`);
    } else {
      weakenElements.push(`${JI_POS[p]}: ${ganji[p]!.ji} → 무근`);
    }
    score += pts; scoreBreakdown[p] = pts;
  }
  scoreBreakdown.total = score;
  // 등급 — 점수 구간 + 득력 강등 (실측 120/120 재현)
  let level = score >= 70 ? 7 : score >= 60 ? 6 : score >= 50 ? 5 : score >= 40 ? 4 : score >= 30 ? 3 : score >= 20 ? 2 : 1;
  if (level === 7 && deukCount < 3) level = 6;
  if (level === 6 && deukCount < 2) level = 5;
  if (level === 5 && deukCount < 1) level = 4;
  const STRENGTH_LABEL = ["", "태약", "신약", "중약", "중화", "중강", "신강", "태왕"];
  const isStrong = level >= 5;

  // ── 귀인 ──
  const findJi = (targets: string[] | undefined, name: string): Positioned[] =>
    (targets ?? []).length === 0 ? [] : jiEntries
      .filter((e) => targets!.includes(e.char))
      .map((e) => ({ position: e.position, ji: e.char, name }));
  const findGanOrJi = (target: string | undefined, name: string): Positioned[] =>
    !target ? [] : [...ganEntries, { position: "일간", char: dayGan, kind: "gan" as const }, ...jiEntries]
      .filter((e) => e.char === target)
      .map((e) => ({ position: e.position, ji: e.char, name }));

  const guiin: Record<string, Positioned[]> = {
    cheoneul: findJi(CHEONEUL[dayGan], "천을귀인"),
    // 태극귀인은 API 실측상 년지·일지만 검사한다
    taegeuk: jiEntries
      .filter((e) => (e.position === "년지" || e.position === "일지") && (TAEGEUK[dayGan] ?? []).includes(e.char))
      .map((e) => ({ position: e.position, ji: e.char, name: "태극귀인" })),
    mungok: findJi([MUNGOK[dayGan]], "문곡귀인"),
    munchang: findJi([MUNCHANG[dayGan]], "문창귀인"),
    bokseong: findJi(BOKSEONG[dayGan], "복성귀인"),
    cheonju: findJi([CHEONJU[dayGan]], "천주귀인"),
    cheongwan: findJi(CHEONGWAN[dayGan], "천관귀인"),
    cheonbok: findJi([CHEONBOK[dayGan]], "천복귀인"),
    hakdang: findJi([JANGSAENG_JI[dayGan]], "학당귀인"),
    jaego: findJi(JAEGO[dayGan], "재고귀인"),
    cheondeok: (() => {
      const t = CHEONDEOK[ganji.month.ji];
      const pool = t.kind === "gan" ? [...ganEntries, { position: "일간", char: dayGan, kind: "gan" as const }] : jiEntries;
      return pool.filter((e) => e.char === t.char).map((e) => ({ position: e.position, ji: e.char, name: "천덕귀인" }));
    })(),
    woldeok: findGanOrJi(WOLDEOK[SAMHAP_GROUP[ganji.month.ji]], "월덕귀인"),
    amrok: findJi([YUKHAP.find((p) => p.includes(ROK[dayGan]))!.find((j) => j !== ROK[dayGan])!], "암록"),
    geumyeo: findJi([GEUMYEO[dayGan]], "금여"),
    yuha: findJi([YUHA[dayGan]], "유하"),
    hyeoprok: (() => {
      // 록지 양옆 지지가 원국에 있으면 협록 (한쪽만 있어도 인정 — API 실측)
      const rokIdx = JIS.indexOf(ROK[dayGan] as typeof JIS[number]);
      const a = JIS[(rokIdx + 1) % 12], b = JIS[(rokIdx + 11) % 12];
      return jiEntries
        .filter((e) => e.char === a || e.char === b)
        .map((e) => ({ position: e.position, ji: e.char, name: "협록" }));
    })(),
  };

  // ── 홍염 · 도화 · 화개 ──
  const hongyeom = findJi(HONGYEOM[dayGan], "홍염살");
  // 도화/화개: 자오묘유 = 도화, 진술축미 = 화개 (luckyloveme 방식)
  const dohwa = jiEntries
    .filter((e) => ["자", "오", "묘", "유"].includes(e.char))
    .map((e) => ({ position: e.position, ji: e.char, name: "도화살", type: `${e.char}${JI_ELEM[e.char]}도화` }));
  const hwagae = jiEntries
    .filter((e) => ["진", "술", "축", "미"].includes(e.char))
    .map((e) => ({ position: e.position, ji: e.char, name: "화개살", type: `${e.char}${JI_ELEM[e.char]}화개` }));

  // ── 12신살 (년지 기준, 4지 전체) ──
  const sibisinsals = jiEntries.map((e) => ({
    position: e.position,
    ji: e.char,
    name: sibisinsalOf(ganji.year.ji, e.char),
  }));

  // ── 비견/겁재 (천간 + 지지 모두 대상) ──
  const bigyeopEntries = [
    ...ganEntries.map((e) => ({ position: e.position, char: e.char, s: sipseongOfGan(dayGan, e.char) })),
    ...jiEntries.map((e) => ({ position: e.position, char: e.char, s: sipseongOfJi(dayGan, e.char) })),
  ];
  const bigyeon = bigyeopEntries.filter((e) => e.s === "비견").map((e) => ({ position: e.position, ganji: e.char, name: "비견" }));
  const geobjae = bigyeopEntries.filter((e) => e.s === "겁재").map((e) => ({ position: e.position, ganji: e.char, name: "겁재" }));

  // ── 합충형해파 (원국 지지 쌍 + 천간합) ──
  const hapchung: LocalAnalysis["hapchung"] = [];
  const jiPillars = PILLARS.filter((p) => p !== "hour" || ganji.hour);
  const pairMatch = (pairs: [string, string][], a: string, b: string) =>
    pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  for (let i = 0; i < jiPillars.length; i++) {
    for (let j = i + 1; j < jiPillars.length; j++) {
      const pa = jiPillars[i], pb = jiPillars[j];
      const a = ganji[pa]!.ji, b = ganji[pb]!.ji;
      const push = (type: string, meaning: string) =>
        hapchung.push({ type, source: a, target: b, sourcePosition: PILLAR_POS[pa], targetPosition: PILLAR_POS[pb], meaning });
      const isYukhap = pairMatch(YUKHAP, a, b);
      if (isYukhap) push("육합", "지지 육합 — 두 기운이 결합해 안정된 흐름을 만든다.");
      if (pairMatch(CHUNG, a, b)) push("지지충", "지지 충 — 두 기운이 정면으로 부딪혀 변화·이동을 만든다.");
      if (pairMatch(HYEONG_PAIRS, a, b) && !(a === b && !["진", "오", "유", "해"].includes(a))) push("지지형", "지지 형 — 마찰과 조정의 기운.");
      if (pairMatch(PA, a, b)) push("지지파", "지지 파 — 관계가 깨지고 다시 정리되는 기운.");
      if (pairMatch(WONJIN, a, b)) push("원진", "원진 — 서로 은근히 어긋나고 불편해지는 기운.");
      if (pairMatch(HAE, a, b)) push("지지해", "지지 해 — 은근한 방해와 어긋남의 기운.");
      // 삼합 반합 — 삼합 3자 중 2자면 인정, 왕지 불요 (API 실측)
      for (const [x, w, z, elem] of SAMHAP) {
        const set = [x, w, z];
        if (set.includes(a) && set.includes(b) && a !== b) {
          push("반합", `삼합(${elem}국) 기운 일부가 결합한다.`);
        }
      }
      // 방합 반방합 (2자) — 가운데 왕지 포함 필수, 같은 쌍이 육합이면 육합만 표기 (API 실측)
      for (const [x, y, z, label] of BANGHAP) {
        const set = [x, y, z];
        if (set.includes(a) && set.includes(b) && a !== b && !isYukhap && (a === y || b === y)) {
          push("반방합", `방합(${label}) 기운 일부가 결합한다.`);
        }
      }
    }
  }
  // 천간합 · 천간충 · 천간충(확장)
  const ganPillars = PILLARS.filter((p) => p !== "hour" || ganji.hour);
  const extendedChungSeen = new Set<string>();
  for (let i = 0; i < ganPillars.length; i++) {
    for (let j = i + 1; j < ganPillars.length; j++) {
      const a = ganji[ganPillars[i]]!.gan, b = ganji[ganPillars[j]]!.gan;
      const pushGan = (type: string, meaning: string) =>
        hapchung.push({ type, source: a, target: b, sourcePosition: PILLAR_POS[ganPillars[i]], targetPosition: PILLAR_POS[ganPillars[j]], meaning });
      const hap = CHEONGAN_HAP.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (hap) pushGan("천간합", `천간합(${hap[2]}) — 두 천간이 끌어당겨 결합한다.`);
      const ia = GANS.indexOf(a as typeof GANS[number]), ib = GANS.indexOf(b as typeof GANS[number]);
      const dist = Math.abs(ia - ib);
      if (dist === 6) pushGan("천간충", "천간충 — 두 천간이 정면으로 부딪힌다.");
      else if (dist === 4 && GAN_YANG[a] === GAN_YANG[b] && (GEUK[GAN_ELEM[a]] === GAN_ELEM[b] || GEUK[GAN_ELEM[b]] === GAN_ELEM[a])) {
        const key = [a, b].sort().join("");
        if (!extendedChungSeen.has(key)) {
          extendedChungSeen.add(key);
          pushGan("천간충(확장)", "천간 상극 — 같은 극성의 두 천간이 극한다.");
        }
      }
    }
  }

  // ── 대운 ──
  const isYang = GAN_YANG[ganji.year.gan];
  const isMale = false; // 성별은 호출부에서 전달 필요 — computeLocalAnalysisWithGender 사용
  const daeun = computeDaeun(input, ganji, dayGan, "female", now);

  // ── 세운 ──
  const birthYear = resolved.raw.y;
  const nowYear = now.getFullYear();
  const koreanAge = (y: number) => y - birthYear + 1;
  const seunItem = (y: number): SeunItem => {
    const g = ganjiOfYear(y);
    return {
      year: y, age: koreanAge(y), ganji: `${g.gan}${g.ji}`, ganji_hanja: hanja(g.gan, g.ji),
      gan: g.gan, ji: g.ji, ganElement: GAN_ELEM[g.gan], jiElement: JI_ELEM[g.ji],
      sipseongRelation: { gan: sipseongOfGan(dayGan, g.gan), ji: sipseongOfJi(dayGan, g.ji) },
      twelveFortune: twelveFortuneOf(dayGan, g.ji),
    };
  };
  const seun = {
    currentSeun: seunItem(nowYear),
    nextSeun: seunItem(nowYear + 1),
    recentSeuns: Array.from({ length: 5 }, (_, i) => seunItem(nowYear - 5 + i)),
    upcomingSeuns: Array.from({ length: 12 }, (_, i) => seunItem(nowYear + 1 + i)),
  };

  // ── 월운 ──
  const weolunItem = (y: number, mo: number): WeolunItem => {
    // 해당 월 15일의 월주 = 그 달의 절기월 간지
    const ec = Solar.fromYmdHms(y, mo, 15, 12, 0, 0).getLunar().getEightChar();
    const { gan, ji } = (() => {
      const gz = ec.getMonth();
      return { gan: Object.entries(GAN_HANJA).find(([, h]) => h === gz[0])![0], ji: Object.entries(JI_HANJA).find(([, h]) => h === gz[1])![0] };
    })();
    return {
      year: y, month: mo, monthLabel: `${y}년 ${mo}월`,
      isCurrentMonth: y === ny && mo === nm,   // ny/nm = 절기월 기준 현재 월 (호출 시점엔 확정됨)
      ganji: `${gan}${ji}`, ganji_hanja: hanja(gan, ji), gan, ji,
      ganElement: GAN_ELEM[gan], jiElement: JI_ELEM[ji],
      sipseongRelation: { gan: sipseongOfGan(dayGan, gan), ji: sipseongOfJi(dayGan, ji) },
    };
  };
  const addMonth = (y: number, mo: number, delta: number) => {
    const t = y * 12 + (mo - 1) + delta;
    return { y: Math.floor(t / 12), mo: (t % 12) + 1 };
  };
  // '현재 월'은 달력이 아니라 절기월 기준 (API 실측 — 예: 9/1은 백로 전이라 신월=8월).
  // 오늘의 실제 월주와 이번 달 15일 기준 월주가 다르면 아직 전월 절기이므로 한 달 물린다.
  let { y: ny, mo: nm } = { y: now.getFullYear(), mo: now.getMonth() + 1 };
  {
    const todayMp = Solar.fromYmdHms(ny, nm, now.getDate(), 12, 0, 0).getLunar().getEightChar().getMonth();
    const midMp = Solar.fromYmdHms(ny, nm, 15, 12, 0, 0).getLunar().getEightChar().getMonth();
    if (todayMp !== midMp) ({ y: ny, mo: nm } = addMonth(ny, nm, now.getDate() < 15 ? -1 : 1));
  }
  const weolun = {
    currentWeolun: weolunItem(ny, nm),
    nextWeolun: (() => { const t = addMonth(ny, nm, 1); return weolunItem(t.y, t.mo); })(),
    recentWeoluns: Array.from({ length: 3 }, (_, i) => { const t = addMonth(ny, nm, i - 3); return weolunItem(t.y, t.mo); }),
    // upcoming 은 다다음 달부터 10개 (다음 달은 nextWeolun 으로 별도)
    upcomingWeoluns: Array.from({ length: 10 }, (_, i) => { const t = addMonth(ny, nm, i + 2); return weolunItem(t.y, t.mo); }),
  };

  void isYang; void isMale;

  return {
    ganji,
    sipseong: { sipseongs, summary },
    twelveFortune: {
      dayGan,
      fortunes,
      summary: `일간 ${dayGan}의 12운성 분포: ${fortunes.map((f) => `${f.position}: ${f.fortune}`).join(", ")}`,
    },
    sinStrength: {
      isStrong, strength: STRENGTH_LABEL[level], level, score,
      bigyeopCount, inseongCount, deukryeong, deukji, deukse,
      description: `${STRENGTH_LABEL[level]}(${level}/7단계) - 점수: ${score}점, 득력: ${deukCount}/3개`,
      wolryeong: wolryeongOf(dayGan, ganji.month.ji),
      detailAnalysis: { scoreBreakdown, supportElements, weakenElements },
    },
    gyeokguk: computeGyeokguk(ganji, dayGan, powers, summary, isStrong, score),
    guiin,
    hongyeom: { hongyeom },
    dohwa: { dohwa },
    hwagae: { hwagae },
    sibisinsals: { sibisinsals },
    bigyeonGeobjae: { bigyeon, geobjae, bigyeonCount: bigyeon.length, geobjaeCount: geobjae.length, totalCount: bigyeon.length + geobjae.length },
    hapchung,
    daeun,
    seun,
    weolun,
  };
}

// 성별이 대운 방향을 결정하므로 별도 진입점 제공
export function computeLocalAnalysisWithGender(
  input: LocalGanjiInput & { gender: "male" | "female" },
  now: Date = new Date(),
): LocalAnalysis {
  const base = computeLocalAnalysis(input, now);
  const ganji = base.ganji;
  base.daeun = computeDaeun(input, ganji, ganji.day.gan, input.gender, now);
  return base;
}

// ── 대운 계산 ────────────────────────────────────────
function computeDaeun(
  input: LocalGanjiInput,
  ganji: LocalGanji,
  dayGan: string,
  gender: "male" | "female",
  now: Date,
): LocalAnalysis["daeun"] {
  const resolved = resolveBirth(input);
  const { y, mo, d, h, mi } = resolved.raw; // 대운 절기 차이는 보정 전 시각 기준 (API 실측)
  const isYang = GAN_YANG[ganji.year.gan];
  const forward = (isYang && gender === "male") || (!isYang && gender === "female");

  // 절기(節)까지의 시간 차 — lunar-typescript 節 시각은 중국시(UTC+8)라 +60분 해서 KST 로 변환.
  // API 실측: 절기 시각은 서머타임기의 벽시계 시각(KST+1h)으로 표기하고,
  // 출생 시각은 서머타임을 제거(-1h)한 값으로 차이를 계산한다.
  const lunar = Solar.fromYmdHms(y, mo, d, h, mi, 0).getLunar();
  const jie = forward ? lunar.getNextJie() : lunar.getPrevJie();
  const jieSolar = jie.getSolar();
  const dateStr = (yy: number, mm: number, dd: number) =>
    `${String(yy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const birthMs = Date.UTC(y, mo - 1, d, h, mi) - dstMinutes(dateStr(y, mo, d)) * 60000;
  const jieMs = Date.UTC(jieSolar.getYear(), jieSolar.getMonth() - 1, jieSolar.getDay(), jieSolar.getHour(), jieSolar.getMinute())
    + (60 + dstMinutes(dateStr(jieSolar.getYear(), jieSolar.getMonth(), jieSolar.getDay()))) * 60000;
  const diffMin = Math.abs(jieMs - birthMs) / 60000;

  // 3일 = 1년 — 나이는 반올림, 시작일은 경과 연수를 일수로 환산해 가산 (API 실측 방식)
  const totalYears = diffMin / (3 * 1440);
  const startAge = Math.max(1, Math.round(totalYears));
  const startDate = new Date(Date.UTC(y, mo - 1, d) + Math.round(totalYears * 365.25) * 86400_000);
  const fmtDate = (dt: Date) => `${dt.getUTCFullYear()}년 ${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일`;

  const all_daeun = Array.from({ length: 10 }, (_, i) => {
    const step = forward ? i + 1 : -(i + 1);
    const g = stepGanji(ganji.month.gan, ganji.month.ji, step);
    const age_start = startAge + i * 10;
    const sd = new Date(startDate);
    sd.setUTCFullYear(sd.getUTCFullYear() + i * 10);
    return {
      sequence: i + 1,
      age_start,
      age_end: age_start + 9,
      ganji: `${g.gan}${g.ji}`,
      ganji_hanja: hanja(g.gan, g.ji),
      start_date: fmtDate(sd),
      year_start: y + age_start - 1,
      year_end: y + age_start + 8,
      sipseong: { gan: sipseongOfGan(dayGan, g.gan), ji: sipseongOfJi(dayGan, g.ji) },
      twelveFortune: twelveFortuneOf(dayGan, g.ji),
    };
  });

  return {
    year_ganji: `${ganji.year.gan}${ganji.year.ji}`,
    is_yang_gan: isYang,
    direction: forward ? "순행" : "역행",
    daeun_start_age: startAge,
    daeun_start_date: fmtDate(startDate),
    current_age: now.getFullYear() - y + 1,
    all_daeun,
  };
}

// ── 격국 · 용신 (luckyloveme 규칙 실측 재현) ─────────────
const JEONWANG_NAME: Record<string, string> = {
  목: "곡직인수격(曲直仁壽)", 화: "염상격(炎上格)", 토: "가색격(稼穡格)", 금: "종혁격(從革格)", 수: "윤하격(潤下格)",
};
const NAEGYEOK_NAME: Record<string, string> = {
  식신: "식신격(食神格)", 상관: "상관격(傷官格)", 편재: "편재격(偏財格)", 정재: "정재격(正財格)",
  편관: "편관격(偏官格)/칠살격", 정관: "정관격(正官格)", 편인: "편인격(偏印格)/효신격", 정인: "정인격(正印格)",
  비견: "건록격(建祿格)", 겁재: "월겁격(月劫格)",
};
const GEUK_BY: Record<string, string> = { 토: "목", 수: "토", 화: "수", 금: "화", 목: "금" }; // key 를 극하는 오행
function categoryElem(be: string): Record<string, string> {
  return {
    비겁: be, 식상: SAENG[be], 재성: GEUK[be], 관성: GEUK_BY[be],
    인성: (Object.keys(SAENG) as string[]).find((k) => SAENG[k] === be)!,
  };
}
function elemToSipsin(be: string, elem: string): string {
  const m = categoryElem(be);
  return Object.keys(m).find((k) => m[k] === elem)!;
}

/** 양인지 — 양간의 제왕지. 월지가 여기에 해당하고 격이 겁재면 양인격 */
const YANGIN_JI: Record<string, string> = { 갑: "묘", 병: "오", 무: "오", 경: "유", 임: "자" };

/** 억부법 과다 카테고리별 용신·희신·기신·구신 (십신 기준, luckyloveme 실측) */
const EOKBU_YONGSIN: Record<string, { 용: string; 희: string; 기: string; 구: string }> = {
  "신강/비겁": { 용: "관성", 희: "재성", 기: "비겁", 구: "인성" },
  "신강/식상": { 용: "식상", 희: "재성", 기: "비겁", 구: "인성" },   // 과다한 인성·비겁이 없을 때 설기
  "신약/기본": { 용: "인성", 희: "관성", 기: "재성", 구: "식상" },   // 과다한 식상·재성·관성이 없을 때
  "신강/인성": { 용: "재성", 희: "식상", 기: "인성", 구: "관성" },
  "신약/식상": { 용: "인성", 희: "관성", 기: "식상", 구: "비겁" },
  "신약/재성": { 용: "비겁", 희: "인성", 기: "재성", 구: "식상" },
  "신약/관성": { 용: "인성", 희: "비겁", 기: "관성", 구: "재성" },
};

function computeGyeokguk(
  ganji: LocalGanji,
  dayGan: string,
  powers: Record<string, number>,
  summary: { bigyeop: number; siksang: number; jaeseong: number; gwanseong: number; inseong: number },
  isStrong: boolean,
  score: number,
): LocalAnalysis["gyeokguk"] {
  const be = GAN_ELEM[dayGan];
  const catElem = categoryElem(be);
  const saengOf = (elem: string) => (Object.keys(SAENG) as string[]).find((k) => SAENG[k] === elem)!;
  const jis = PILLARS.filter((p) => p !== "hour" || ganji.hour).map((p) => ganji[p]!.ji);
  // 근(根): 지지 본기(정기)가 비겁 또는 인성인가 — 여기·중기는 근으로 안 본다 (API 실측 화격 10 / 가화격 7건 전건 일치)
  const rootElems = [be, catElem["인성"]];
  const hasRoot = jis.some((ji) => rootElems.includes(GAN_ELEM[JIJANGGAN[ji][JIJANGGAN[ji].length - 1][0]]));
  // 원국 글자 오행 단순 개수
  const charElems = PILLARS.filter((p) => p !== "hour" || ganji.hour)
    .flatMap((p) => [GAN_ELEM[ganji[p]!.gan], JI_ELEM[ganji[p]!.ji]]);
  const beCount = charElems.filter((e) => e === be).length;

  // 억부법 용신 (내격 · 가화격 공용) — luckyloveme 실측 규칙 (94/94 재현)
  //  · 과다 판정: 십성 개수가 2개 이상인 첫 항목을 고정 순서로 선택
  //    (신강 인성→비겁, 신약 식상→재성→관성. 2개 이상이 없으면 개수 최대)
  //  · 용신·희신·기신·구신은 과다 카테고리별 고정 (기신은 언제나 과다 오행 자체)
  const eokbu = () => {
    const counts: Record<string, number> = {
      비겁: summary.bigyeop, 식상: summary.siksang, 재성: summary.jaeseong,
      관성: summary.gwanseong, 인성: summary.inseong,
    };
    const order = isStrong ? ["인성", "비겁"] : ["식상", "재성", "관성"];
    // 과다한 십성이 없으면 신강은 설기(식상), 신약은 기본 원리(인성)로 간다 (실측)
    const category = order.find((k) => counts[k] >= 2);
    const key = category
      ? `${isStrong ? "신강" : "신약"}/${category}`
      : (isStrong ? "신강/식상" : "신약/기본");
    const { 용, 희, 기, 구 } = EOKBU_YONGSIN[key];
    return {
      yongsin: {
        십신: 용, 오행: catElem[용], method: "억부법",
        reason: category
          ? `${isStrong ? "신강" : "신약"} 사주에서 ${category}이 과다하여 ${용}을 용신으로 선택`
          : isStrong
            ? "신강 사주에서 설기를 위해 식상을 용신으로 선택"
            : "신약 사주의 기본 원리에 따라 인성을 용신으로 선택",
      },
      희신오행: catElem[희],
      기신오행: catElem[기],
      구신오행: catElem[구],
    };
  };

  // ① 전왕격 — 일간 오행이 원국 글자의 절반(4개) 이상 (합화보다 우선 — API 실측)
  if (beCount >= 4) {
    return {
      type: "전왕격", name: JEONWANG_NAME[be],
      reason: `일간 ${be}오행이 원국에 ${beCount}개(${Math.round((beCount / charElems.length) * 100)}%)로 압도적. ${JEONWANG_NAME[be]}으로 판정. 강한 기운을 거스르지 않고 따르는 것이 길하며, ${be}, ${saengOf(be)}오행이 용신.`,
      yongsin: { 십신: "비겁", 오행: be, method: "종격", reason: "" },
      희신오행: saengOf(be), 기신오행: GEUK_BY[be], 구신오행: GEUK[be],
      신강여부: isStrong, 신강점수: score,
    };
  }

  // ② 화격 · 가화격 — 일간이 시간과 합화하고 근이 없으면 화격,
  //    월간/시간 합화에 근이 있고 합화 오행이 지지에 2개 이상이면 가화격 (API 실측)
  const partners: [PillarKey, string][] = ([["month", ganji.month.gan], ["hour", ganji.hour?.gan]] as [PillarKey, string | undefined][])
    .filter((x): x is [PillarKey, string] => !!x[1]);
  for (const [, pg] of partners) {
    const hap = CHEONGAN_HAP.find(([x, y]) => (x === dayGan && y === pg) || (x === pg && y === dayGan));
    if (!hap) continue;
    const he = hap[2];
    const pairLabel = `${dayGan}${pg}`;
    // 순수 화격 — 근이 없으면 월령 여부와 무관하게 성립 (실측 근없음 합케이스 15건 전건)
    if (!hasRoot) {
      return {
        type: "화격", name: `${pairLabel}합${he} 화격`,
        reason: `${pairLabel}합화 성립. 일간(${dayGan})의 근이 지지에 없어 순수 화격으로 판정. 합화한 ${he}오행을 용신으로 사용.`,
        yongsin: { 십신: elemToSipsin(be, he), 오행: he, method: "화격", reason: `화격 성립으로 합화한 ${he}오행이 용신. 합화 오행을 돕는 운이 길하고, 합을 깨는 운은 흉함.` },
        희신오행: saengOf(he), 기신오행: GEUK_BY[he], 구신오행: GEUK[he],
        신강여부: isStrong, 신강점수: score,
      };
    }
    const heJiCount = jis.filter((ji) => JI_ELEM[ji] === he).length;
    if (hasRoot && heJiCount >= 2) {
      return {
        type: "가화격", name: `${pairLabel}합 가화격 (억부법 병행)`,
        reason: `${pairLabel}합화 성립. 일간(${dayGan})에 근이 있으나 ${he}오행이 지지에 ${heJiCount}개로 왕성하여 가화격으로 판정. 억부법을 병행하여 분석.`,
        ...eokbu(),
        신강여부: isStrong, 신강점수: score,
      };
    }
  }

  // ③ 내격 — 월지 지장간의 투간(본기→중기→여기 순) 우선, 없으면 본기.
  //    왕지(자·오·묘·유)의 본기와 같은 오행인 지장간은 후보에서 제외 (API 실측)
  const grades = TONGGEUN_GRADE[ganji.month.ji];
  const stemOf = (g: "본기" | "중기" | "여기") => Object.keys(grades).find((h) => grades[h] === g);
  const bongi = stemOf("본기")!;
  const cands = (["본기", "중기", "여기"] as const)
    .map(stemOf)
    .filter((h): h is string => !!h && (h === bongi || GAN_ELEM[h] !== GAN_ELEM[bongi]));
  const others = PILLARS.filter((p) => p !== "day" && (p !== "hour" || ganji.hour)).map((p) => ganji[p]!.gan);
  const pickStem = cands.find((h) => others.includes(h)) ?? bongi;
  const monthSipseong = sipseongOfGan(dayGan, pickStem);
  // 비겁 계열 격 이름 — 비견은 건록격, 겁재는 월지가 양인지면 양인격,
  // 그 외에는 월지가 그 본기의 록지(자오묘유·인신사해)일 때만 월겁격, 나머지는 건록격
  const name = monthSipseong !== "겁재"
    ? NAEGYEOK_NAME[monthSipseong]
    : YANGIN_JI[dayGan] === ganji.month.ji
      ? "양인격(羊刃格)"
      : pickStem === bongi && ROK[bongi] === ganji.month.ji
        ? "월겁격(月劫格)"
        : "건록격(建祿格)";
  return {
    type: "내격", name,
    reason: `월지 지장간이 ${monthSipseong}에 해당합니다.`,
    ...eokbu(),
    신강여부: isStrong, 신강점수: score,
  };
}

// =====================================================
// 운(대운·세운·월운) 판정 — luckyloveme yongsinJudgment 재현
// =====================================================
// 판정 셋(용신·희신·기신)은 원국과 별개로 재판정한다 (실측 35/35):
//  · 신강 = 점수>=60, 또는 월지 본기가 비겁이고 점수>=40
//  · 카테고리·용희기구 = 억부 규칙 동일 (EOKBU_YONGSIN)
//  · 전왕격·화격·종격 등 비억부 사주는 원국 격국 셋을 그대로 사용
// 종합점수는 근사(±15 내외) — 역할 베이스 + 합충 보정. 판정 라벨·근거는 정확 재현.

/** 월령 관계 한 줄 설명 (sinStrength.wolryeong) */
function wolryeongOf(dayGan: string, monthJi: string): string {
  const ss = sipseongOfJi(dayGan, monthJi);
  const cat = SIPSEONG_CATEGORY[ss];
  if (cat === "비겁성") return `월지 ${monthJi}에서 일간 ${dayGan}이 득령함 (${ss})`;
  if (cat === "인성") return `월지 ${monthJi}에서 일간 ${dayGan}이 생함을 받음 (인성)`;
  if (cat === "식상성") return `일간 ${dayGan}이 월지 ${monthJi}에 생함을 줌 (식상)`;
  if (cat === "재성") return `월지 ${monthJi}을 일간 ${dayGan}이 극함 (재성)`;
  return `월지 ${monthJi}에서 일간 ${dayGan}이 극함을 받음 (관성)`;
}

export type UnHapChungRelation = {
  type: string; source: string; target: string;
  sourcePosition: string; targetPosition: string; meaning: string;
};

const UN_REL_MEANING: Record<string, string> = {
  합: "천간합 — 운의 천간이 원국 천간과 결합해 협력·인연의 기운이 생깁니다.",
  충: "천간충 — 의지와 명분이 부딪혀 갈등과 전환의 계기가 생깁니다.",
  육합: "지지육합 — 두 지지가 은근히 결합해 화합의 기운이 흐릅니다.",
  지충: "지지충 — 해당 영역의 기반이 흔들리며 변화·이동수가 생깁니다.",
  형: "지지형(刑) — 마찰과 조정의 기운. 법적·제도적 문제나 관계 조율에 주의가 필요합니다.",
  파: "지지파(破) — 진행하던 일이 중도에 깨지기 쉬우나 새 국면의 전환점이 되기도 합니다.",
  해: "지지해(害) — 은근한 방해와 어긋남. 신뢰 관계 관리가 중요합니다.",
  원진: "원진 — 이유 없는 불화·미움의 기운. 감정 소모를 줄이는 지혜가 필요합니다.",
  삼합: "삼합 완성 — 원국 지지와 세 글자 국을 이뤄 해당 오행 기운이 강하게 발동합니다.",
  반합: "반합(삼합 일부) — 해당 오행 기운이 부분적으로 결합해 잠재적으로 작동합니다.",
  방합: "방합 완성 — 같은 방위 세 글자가 모여 해당 계절 오행이 왕성해집니다.",
  반방합: "반방합(방합 일부) — 같은 방위 기운이 부분적으로 결합합니다.",
};

/** 운 간지 vs 원국의 합충 관계 — luckyloveme 세운 hapChungRelations 재현 (실측 720/720) */
export function computeUnHapChung(
  unGan: string, unJi: string, ganji: LocalGanji, sourcePosition: string,
): UnHapChungRelation[] {
  const out: UnHapChungRelation[] = [];
  const natalJis = PILLARS.filter((p) => p !== "hour" || ganji.hour).map((p) => ganji[p]!.ji);
  const push = (type: string, source: string, target: string, targetPosition: string) =>
    out.push({ type, source, target, sourcePosition, targetPosition, meaning: UN_REL_MEANING[type] ?? "" });
  for (const p of PILLARS) {
    if (p === "hour" && !ganji.hour) continue;
    const pos = PILLAR_POS[p];
    const { gan, ji } = ganji[p]!;
    // 천간합 · 천간충
    const hap = CHEONGAN_HAP.find(([x, y]) => (x === unGan && y === gan) || (x === gan && y === unGan));
    if (hap) push("합", unGan, gan, pos);
    if (Math.abs(GANS.indexOf(unGan as typeof GANS[number]) - GANS.indexOf(gan as typeof GANS[number])) === 6) push("충", unGan, gan, pos);
    // 지지 2자 관계
    const a = unJi, b = ji;
    const isYukhap = YUKHAP.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    if (isYukhap) push("육합", a, b, pos);
    if (CHUNG.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) push("충", a, b, pos);
    if (PA.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) push("파", a, b, pos);
    if (WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) push("원진", a, b, pos);
    if (HAE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) push("해", a, b, pos);
    if (HYEONG_PAIRS.some(([x, y]) => (a === b ? (x === a && y === a) : (x === a && y === b) || (x === b && y === a)))) push("형", a, b, pos);
    // 삼합 — 두 글자면 반합(왕지 불요), 원국에 셋째 글자가 있으면 삼합으로 승격 (실측)
    for (const [x, y, z] of SAMHAP) {
      const t = [x, y, z];
      if (!(t.includes(a) && t.includes(b) && a !== b)) continue;
      const third = t.find((c) => c !== a && c !== b)!;
      push(natalJis.includes(third) ? "삼합" : "반합", a, b, pos);
    }
    // 방합 — 같은 쌍이 육합이면 표기 생략, 완성이면 방합, 미완성은 왕지 포함 시만 반방합 (실측)
    for (const [x, y, z] of BANGHAP) {
      const t = [x, y, z];
      if (!(t.includes(a) && t.includes(b) && a !== b)) continue;
      if (isYukhap) continue;
      const third = t.find((c) => c !== a && c !== b)!;
      if (natalJis.includes(third)) { push("방합", a, b, pos); continue; }
      if (a === y || b === y) push("반방합", a, b, pos);
    }
  }
  return out;
}

export type UnYongsinSet = {
  용신오행: string; 희신오행: string; 기신오행: string; 구신오행: string; 한신오행: string;
  판정근거: string;
};

/** 운 판정용 용신 셋 — 원국과 별도로 재판정 (실측 35/35 재현) */
export function computeUnYongsinSet(analysis: LocalAnalysis): UnYongsinSet {
  const dayGan = analysis.ganji.day.gan;
  const be = GAN_ELEM[dayGan];
  const catElem = categoryElem(be);
  const 한신Of = (used: string[]) => (["목", "화", "토", "금", "수"] as string[]).find((e) => !used.includes(e))!;
  // 비억부 사주(전왕격·화격·종격)는 원국 격국 셋 그대로
  if (analysis.gyeokguk.yongsin.method !== "억부법") {
    const g = analysis.gyeokguk;
    return {
      용신오행: g.yongsin.오행, 희신오행: g.희신오행, 기신오행: g.기신오행, 구신오행: g.구신오행,
      한신오행: 한신Of([g.yongsin.오행, g.희신오행, g.기신오행, g.구신오행]),
      판정근거: g.reason,
    };
  }
  // 신강 재판정 — (월지 본기가 비겁 && 점수>=40) 또는 (득령 && 점수>=60), 실측 41/41
  const score = analysis.sinStrength.score;
  const monthJi = analysis.ganji.month.ji;
  const grades = TONGGEUN_GRADE[monthJi];
  const bongi = Object.keys(grades).find((h) => grades[h] === "본기")!;
  const strong = (GAN_ELEM[bongi] === be && score >= 40) || (analysis.sinStrength.deukryeong && score >= 60);
  const s = analysis.sipseong.summary;
  const counts: Record<string, number> = { 비겁: s.bigyeop, 식상: s.siksang, 재성: s.jaeseong, 관성: s.gwanseong, 인성: s.inseong };
  const order = strong ? ["인성", "비겁"] : ["식상", "재성", "관성"];
  const category = order.find((k) => counts[k] >= 2);
  const key = category ? `${strong ? "신강" : "신약"}/${category}` : (strong ? "신강/식상" : "신약/기본");
  const { 용, 희, 기, 구 } = EOKBU_YONGSIN[key];
  const 판정근거 = category
    ? `${strong ? "신강" : "신약"} 사주에서 ${category}이 과다하여 ${용}을 용신으로 선택`
    : strong ? "신강 사주에서 설기를 위해 식상을 용신으로 선택" : "신약 사주의 기본 원리에 따라 인성을 용신으로 선택";
  const set = { 용신오행: catElem[용], 희신오행: catElem[희], 기신오행: catElem[기], 구신오행: catElem[구] };
  return { ...set, 한신오행: 한신Of(Object.values(set)), 판정근거 };
}

export type UnYongsinJudgment = {
  종합판정: string; 종합점수: number; 천간판정: string; 지지판정: string;
  용신오행: string; 희신오행: string; 기신오행: string; 판정근거: string;
};

// 종합점수 근사 베이스 (세운 720 + 월운 600 샘플 회귀 반올림 — 세운 RMSE ~14, 월운 ~13)
const UN_SCORE_BASE: Record<string, { gan: Record<string, number>; ji: Record<string, number>; good: number; bad: number }> = {
  세운: {
    gan: { 용신운: 28, 희신운: 18, 기신운: -23, 구신운: -10, 한신운: 0 },
    ji: { 용신운: 27, 희신운: 13, 기신운: -19, 구신운: -17, 한신운: 0 },
    good: 4, bad: -5,
  },
  월운: {
    gan: { 용신운: 32, 희신운: 19, 기신운: -26, 구신운: -14, 한신운: -1 },
    ji: { 용신운: 67, 희신운: 40, 기신운: -72, 구신운: -35, 한신운: 0 },
    good: 3, bad: -3,
  },
};
const GOOD_REL = new Set(["합", "육합", "반합", "삼합", "방합", "반방합"]);

/** 운 1건(세운/월운) 판정 — 라벨·근거는 정확, 점수는 근사 */
export function judgeUn(
  unGan: string, unJi: string, set: UnYongsinSet, ganji: LocalGanji,
  kind: "세운" | "월운",
): UnYongsinJudgment {
  const role = (elem: string) =>
    elem === set.용신오행 ? "용신운" : elem === set.희신오행 ? "희신운"
      : elem === set.기신오행 ? "기신운" : elem === set.구신오행 ? "구신운" : "한신운";
  const ganRole = role(GAN_ELEM[unGan]);
  const jiRole = role(JI_ELEM[unJi]);
  const base = UN_SCORE_BASE[kind];
  let score = base.gan[ganRole] + base.ji[jiRole];
  for (const r of computeUnHapChung(unGan, unJi, ganji, kind)) {
    score += GOOD_REL.has(r.type) ? base.good : base.bad;
  }
  // 판정 구간 (실측 경계): 세운은 |점수|<=10 평, 월운은 0만 평
  const 종합판정 = kind === "세운"
    ? (score >= 40 ? "대길" : score >= 11 ? "소길" : score >= -10 ? "평" : score >= -39 ? "소흉" : "대흉")
    : (score >= 50 ? "대길" : score >= 1 ? "소길" : score === 0 ? "평" : score >= -49 ? "소흉" : "대흉");
  return {
    종합판정, 종합점수: score, 천간판정: ganRole, 지지판정: jiRole,
    용신오행: set.용신오행, 희신오행: set.희신오행, 기신오행: set.기신오행, 판정근거: set.판정근거,
  };
}
