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
// 천덕귀인 (월지 → 간 또는 지)
const CHEONDEOK: Record<string, string> = {
  인: "정", 묘: "신", 진: "임", 사: "신", 오: "해", 미: "갑",
  신: "계", 유: "인", 술: "병", 해: "을", 자: "사", 축: "경",
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

/** 오행별 세력 — 지장간 배분 가중 합 (신강 점수·억부 과다 판정 공용).
 *  가중치는 luckyloveme 점수 실측 피팅값(70샘플, 평균 오차 ±3.4점):
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
  // 천간합화 (API 실측): 인접한 천간합(년-월, 월-일, 일-시)이 있고 월지 오행이
  // 합화 오행과 같거나 이를 생하면, 일간이 아닌 천간은 합화 오행으로 바꿔 십성을 계산한다.
  const monthElem = JI_ELEM[ganji.month.ji];
  const effElem: Partial<Record<PillarKey, string>> = {};
  const ADJACENT: [PillarKey, PillarKey][] = [["year", "month"], ["month", "day"], ["day", "hour"]];
  for (const [pa, pb] of ADJACENT) {
    if (pb === "hour" && !ganji.hour) continue;
    const ga = ganji[pa]!.gan, gb = ganji[pb]!.gan;
    const hap = CHEONGAN_HAP.find(([x, y]) => (x === ga && y === gb) || (x === gb && y === ga));
    if (!hap) continue;
    const he = hap[2];
    // 성립 조건 (API 실측): ① 월지가 합화 오행을 돕고(같거나 생)
    // ② 합화 오행이 일간을 극하지 않으며 ③ 같은 글자의 천간이 비인접으로 더 있으면(쟁합) 불성립
    const allPos = PILLARS.filter((pp) => pp !== "hour" || ganji.hour);
    const adjacentPaired = new Set([pa, pb]);
    const jaenghap = allPos.some((pp) =>
      !adjacentPaired.has(pp)
      && (ganji[pp]!.gan === ganji[pa]!.gan || ganji[pp]!.gan === ganji[pb]!.gan)
      && !ADJACENT.some(([qa, qb]) => (qa === pp || qb === pp)
        && CHEONGAN_HAP.some(([x, y]) => (x === ganji[qa]!.gan && y === ganji[qb]!.gan) || (x === ganji[qb]!.gan && y === ganji[qa]!.gan))
        && (qb !== "hour" || ganji.hour)),
    );
    if ((monthElem === he || SAENG[monthElem] === he) && GEUK[he] !== GAN_ELEM[dayGan] && !jaenghap) {
      if (pa !== "day") effElem[pa] = he;
      if (pb !== "day") effElem[pb] = he;
    }
  }
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
  // 점수(근사 — 실측 피팅, 평균 오차 ±4점) → 7단계 등급 (등급 규칙은 실측 40/40 재현)
  const powers = elementPowers(ganji);
  const beElem = GAN_ELEM[dayGan];
  const ieElem = (Object.keys(SAENG) as string[]).find((k) => SAENG[k] === beElem)!;
  const totalPower = Object.values(powers).reduce((a, b) => a + b, 0);
  const helperPower = powers[beElem] + powers[ieElem];
  const score = Math.max(0, Math.min(100, Math.round((100 * helperPower) / totalPower) + (deukryeong ? 10 : 0)));
  let level = score >= 70 ? 7 : score >= 60 ? 6 : score >= 50 ? 5 : score >= 40 ? 4 : score >= 30 ? 3 : score >= 26 ? 2 : 1;
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
    cheondeok: findGanOrJi(CHEONDEOK[ganji.month.ji], "천덕귀인"),
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
      isCurrentMonth: y === now.getFullYear() && mo === now.getMonth() + 1,
      ganji: `${gan}${ji}`, ganji_hanja: hanja(gan, ji), gan, ji,
      ganElement: GAN_ELEM[gan], jiElement: JI_ELEM[ji],
      sipseongRelation: { gan: sipseongOfGan(dayGan, gan), ji: sipseongOfJi(dayGan, ji) },
    };
  };
  const addMonth = (y: number, mo: number, delta: number) => {
    const t = y * 12 + (mo - 1) + delta;
    return { y: Math.floor(t / 12), mo: (t % 12) + 1 };
  };
  const ny = now.getFullYear(), nm = now.getMonth() + 1;
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
  // 근(根): 지지 본기(정기)에 일간 오행(비겁)이 있는가 — API 실측상 여기·중기는 근으로 안 본다
  const hasRoot = jis.some((ji) => GAN_ELEM[JIJANGGAN[ji][JIJANGGAN[ji].length - 1][0]] === be);
  // 원국 글자 오행 단순 개수
  const charElems = PILLARS.filter((p) => p !== "hour" || ganji.hour)
    .flatMap((p) => [GAN_ELEM[ganji[p]!.gan], JI_ELEM[ganji[p]!.ji]]);
  const beCount = charElems.filter((e) => e === be).length;

  // 억부법 용신 (내격 · 가화격 공용) — 과다 판정은 오행 세력 기준
  const eokbu = () => {
    let category: string, yong: string;
    if (isStrong) {
      category = powers[catElem["비겁"]] >= powers[catElem["인성"]] ? "비겁" : "인성";
      yong = category === "비겁" ? "관성" : "재성";
    } else {
      const cands: [string, number][] = [["식상", powers[catElem["식상"]]], ["재성", powers[catElem["재성"]]], ["관성", powers[catElem["관성"]]]];
      cands.sort((a, b) => b[1] - a[1]);
      category = cands[0][0];
      yong = category === "재성" ? "비겁" : "인성";
    }
    const yongElem = catElem[yong];
    return {
      yongsin: {
        십신: yong, 오행: yongElem, method: "억부법",
        reason: `${isStrong ? "신강" : "신약"} 사주에서 ${category}이 과다하여 ${yong}을 용신으로 선택`,
      },
      희신오행: saengOf(yongElem),
      기신오행: GEUK[yongElem],
      구신오행: SAENG[yongElem],
    };
  };

  // ① 화격 · 가화격 — 일간이 인접 천간합(월간/시간)으로 합화
  const partners = [ganji.month.gan, ganji.hour?.gan].filter(Boolean) as string[];
  for (const pg of partners) {
    const hap = CHEONGAN_HAP.find(([x, y]) => (x === dayGan && y === pg) || (x === pg && y === dayGan));
    if (!hap) continue;
    const he = hap[2];
    const monthElem = JI_ELEM[ganji.month.ji];
    if (!(monthElem === he || SAENG[monthElem] === he)) continue;
    const pairLabel = `${hap[0]}${hap[1]}`;
    if (!hasRoot) {
      return {
        type: "화격", name: `${pairLabel}합화 화격`,
        reason: `${pairLabel}합화 성립. 일간(${dayGan})의 근이 지지에 없어 순수 화격으로 판정. 합화한 ${he}오행을 용신으로 사용.`,
        yongsin: { 십신: elemToSipsin(be, he), 오행: he, method: "화격", reason: `화격 성립으로 합화한 ${he}오행이 용신. 합화 오행을 돕는 운이 길하고, 합을 깨는 운은 흉함.` },
        희신오행: saengOf(he), 기신오행: GEUK_BY[he], 구신오행: GEUK[he],
        신강여부: isStrong, 신강점수: score,
      };
    }
    const heJiCount = jis.filter((ji) => JI_ELEM[ji] === he).length;
    if (heJiCount >= 2) {
      return {
        type: "가화격", name: `${pairLabel}합 가화격 (억부법 병행)`,
        reason: `${pairLabel}합화 성립. 일간(${dayGan})에 근이 있으나 ${he}오행이 지지에 ${heJiCount}개로 왕성하여 가화격으로 판정. 억부법을 병행하여 분석.`,
        ...eokbu(),
        신강여부: isStrong, 신강점수: score,
      };
    }
  }

  // ② 전왕격 — 일간 오행이 원국 글자의 절반(4개) 이상
  if (beCount >= 4) {
    return {
      type: "전왕격", name: JEONWANG_NAME[be],
      reason: `일간 ${be}오행이 원국에 ${beCount}개(${Math.round((beCount / charElems.length) * 100)}%)로 압도적. ${JEONWANG_NAME[be]}으로 판정. 강한 기운을 거스르지 않고 따르는 것이 길하며, ${be}, ${saengOf(be)}오행이 용신.`,
      yongsin: { 십신: "비겁", 오행: be, method: "종격", reason: "" },
      희신오행: saengOf(be), 기신오행: GEUK_BY[be], 구신오행: GEUK[be],
      신강여부: isStrong, 신강점수: score,
    };
  }

  // ③ 종격 — 근이 없고 특정 십성이 4개 이상 압도 + 일간이 매우 약할 때만 (API 실측)
  if (!hasRoot && score <= 25) {
    const doms: [string, string, string, number][] = [
      ["종재격", "從財格", "재성", summary.jaeseong],
      ["종살격", "從殺格", "관성", summary.gwanseong],
      ["종아격", "從兒格", "식상", summary.siksang],
    ];
    for (const [nm, hanja2, cat, cnt] of doms) {
      if (cnt >= 4) {
        const elem = catElem[cat];
        return {
          type: nm, name: `${nm}(${hanja2})`,
          reason: `일간에 근이 없고 ${cat}이 ${cnt}개로 압도적. ${nm}으로 판정.`,
          yongsin: { 십신: cat, 오행: elem, method: "종격", reason: "" },
          희신오행: saengOf(elem), 기신오행: GEUK_BY[elem], 구신오행: GEUK[elem],
          신강여부: isStrong, 신강점수: score,
        };
      }
    }
  }

  // ④ 내격 — 왕지(자오묘유)는 본기 고정, 그 외는 투간(본기→중기→여기 순) 우선 (API 실측 55/58)
  const hidden = JIJANGGAN[ganji.month.ji];
  const mainStem = hidden[hidden.length - 1][0];
  let pickStem = mainStem;
  if (!["자", "오", "묘", "유"].includes(ganji.month.ji)) {
    const others = PILLARS.filter((p) => p !== "day" && (p !== "hour" || ganji.hour)).map((p) => ganji[p]!.gan);
    for (let k = hidden.length - 1; k >= 0; k--) {
      if (others.includes(hidden[k][0])) { pickStem = hidden[k][0]; break; }
    }
  }
  const monthSipseong = sipseongOfGan(dayGan, pickStem);
  return {
    type: "내격", name: NAEGYEOK_NAME[monthSipseong],
    reason: `월지 지장간이 ${monthSipseong}에 해당합니다.`,
    ...eokbu(),
    신강여부: isStrong, 신강점수: score,
  };
}
