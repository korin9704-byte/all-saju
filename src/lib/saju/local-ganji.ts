// =====================================================
// 로컬 만세력 — 사주 원국(ganji) 계산 (luckyloveme 대체 1단계)
// =====================================================
// lunar-typescript(6tail) 기반. 절기(절입 시각) 기준 년주·월주,
// 60갑자 일주, 오서둔 시주를 계산해 luckyloveme ganji 응답과
// 같은 형태(한글 간지)로 반환한다.
//
// 아직 실서비스 경로에 연결하지 않는다 — scripts/golden-ganji.ts 로
// luckyloveme 응답과 대조 검증을 통과한 뒤 교체한다.

import { Solar, Lunar } from "lunar-typescript";

export type LocalGanjiInput = {
  birthYear: string;   // "1990"
  birthMonth: string;  // "5" (1~12)
  birthDay: string;    // "15"
  birthHour?: string;  // "14" — 없으면 시주 null
  birthMinute?: string;
  calendarType: "양력" | "음력";
  isLeapMonth?: boolean;
  /** 야자시(23시~24시 출생 시 일주를 당일로 유지) 규칙 적용 여부. 기본 false = 23시부터 다음 날 일주 */
  useYajasiRule?: boolean;
};

export type LocalGanji = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
};

// 한자 → 한글 간지 매핑
const GAN_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};
const JI_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

function toKo(ganzhi: string): { gan: string; ji: string } {
  const gan = GAN_KO[ganzhi[0]];
  const ji = JI_KO[ganzhi[1]];
  if (!gan || !ji) throw new Error(`간지 변환 실패: ${ganzhi}`);
  return { gan, ji };
}

// ── 시각 보정 (luckyloveme 동일 규칙) ────────────────
// ① 서머타임 시행기: 시계가 1시간 빠르므로 -60분
//    (기간은 tz database Asia/Seoul 기준)
// ② 진태양시: 서울 기준 -30분. luckyloveme 실측 결과 1954~61년
//    UTC+8:30 시대에도 동일하게 -30분을 적용한다 (시대 예외 없음).
const DST_PERIODS: [string, string][] = [
  ["1948-06-01", "1948-09-13"],
  ["1949-04-03", "1949-09-11"],
  ["1950-04-01", "1950-09-11"],
  ["1951-05-06", "1951-09-09"],
  ["1955-05-05", "1955-09-09"],
  ["1956-05-20", "1956-09-30"],
  ["1957-05-05", "1957-09-22"],
  ["1958-05-04", "1958-09-21"],
  ["1959-05-03", "1959-09-20"],
  ["1960-05-01", "1960-09-18"],
  ["1987-05-10", "1987-10-11"],
  ["1988-05-08", "1988-10-09"],
];

/** 해당 날짜가 서머타임 시행기면 60, 아니면 0 */
export function dstMinutes(dateStr: string): number {
  return DST_PERIODS.some(([s, e]) => dateStr >= s && dateStr < e) ? 60 : 0;
}

function correctionMinutes(dateStr: string): number {
  return -30 - dstMinutes(dateStr);
}

/** 음력→양력 변환 + 시각 보정을 거친 확정 시각 (파생 계산 공용) */
export type ResolvedBirth = {
  /** 양력 원본 (보정 전) */
  raw: { y: number; mo: number; d: number; h: number; mi: number };
  /** 진태양시·서머타임 보정 후 */
  corrected: { y: number; mo: number; d: number; h: number; mi: number };
  hasTime: boolean;
};

export function resolveBirth(input: LocalGanjiInput): ResolvedBirth {
  const y = parseInt(input.birthYear, 10);
  const mo = parseInt(input.birthMonth, 10);
  const d = parseInt(input.birthDay, 10);
  const hasTime = input.birthHour != null && input.birthHour !== "";
  const h = hasTime ? parseInt(input.birthHour!, 10) : 12;
  const mi = hasTime ? parseInt(input.birthMinute ?? "0", 10) : 0;

  let sy = y, smo = mo, sd = d;
  if (input.calendarType === "음력") {
    const solar = Lunar.fromYmd(y, input.isLeapMonth ? -mo : mo, d).getSolar();
    sy = solar.getYear(); smo = solar.getMonth(); sd = solar.getDay();
  }

  let cy = sy, cmo = smo, cd = sd, ch = h, cmi = mi;
  if (hasTime) {
    const dateStr = `${String(sy).padStart(4, "0")}-${String(smo).padStart(2, "0")}-${String(sd).padStart(2, "0")}`;
    const corrected = new Date(Date.UTC(sy, smo - 1, sd, h, mi) + correctionMinutes(dateStr) * 60_000);
    cy = corrected.getUTCFullYear(); cmo = corrected.getUTCMonth() + 1; cd = corrected.getUTCDate();
    ch = corrected.getUTCHours(); cmi = corrected.getUTCMinutes();
  }

  return { raw: { y: sy, mo: smo, d: sd, h, mi }, corrected: { y: cy, mo: cmo, d: cd, h: ch, mi: cmi }, hasTime };
}

export function computeLocalGanji(input: LocalGanjiInput): LocalGanji {
  // 시간 미상: 시주 경계(23시)와 무관한 정오로 계산해 일주만 확정
  const { corrected, hasTime } = resolveBirth(input);
  const { y: cy, mo: cmo, d: cd, h: ch, mi: cmi } = corrected;

  const ec = Solar.fromYmdHms(cy, cmo, cd, ch, cmi, 0).getLunar().getEightChar();
  // sect 1: 밤 23시 이후 일주를 다음 날로 (기본) / sect 2: 야자시 — 당일 유지
  ec.setSect(input.useYajasiRule ? 2 : 1);

  return {
    year: toKo(ec.getYear()),
    month: toKo(ec.getMonth()),
    day: toKo(ec.getDay()),
    hour: hasTime ? toKo(ec.getTime()) : null,
  };
}
