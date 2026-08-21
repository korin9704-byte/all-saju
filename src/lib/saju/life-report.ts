// =====================================================
// 인생 사주 (life-saju) — 13장 평생 리포트 생성 모듈
// =====================================================
// luckyloveme 풀 분석(16종)을 근거로 장별 프롬프트 27개를 병렬 호출해
// 챕터 본문을 생성하고, 데이터 카드(명식표·대운표·오행·세운표 등)와 함께
// 모바일 챕터 뷰어용 views 배열(JSON)로 조립한다.
// 결과는 saju_results.interpretation_md 에 JSON 문자열로 저장된다.

import { generateInterpretation } from "@/lib/saju/llm";
import type { SajuAnalysisResponse } from "@/lib/saju/saju-api";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Api = any;

export const LIFE_SLUG = "life-saju";
export const LIFE_PAYLOAD_TYPE = "life-saju-v1";

export type LifeView = { label: string; title: string; html: string };
export type LifeReportPayload = {
  type: typeof LIFE_PAYLOAD_TYPE;
  name: string;
  birthLabel: string;
  views: LifeView[];
};

export function parseLifePayload(md: string | null | undefined): LifeReportPayload | null {
  if (!md || !md.startsWith("{")) return null;
  try {
    const obj = JSON.parse(md);
    return obj?.type === LIFE_PAYLOAD_TYPE ? (obj as LifeReportPayload) : null;
  } catch {
    return null;
  }
}

// ── 한자 병기 ───────────────────────────────────────
const HANJA: Record<string, string> = {
  비견: "比肩", 겁재: "劫財", 식신: "食神", 상관: "傷官", 편재: "偏財",
  정재: "正財", 편관: "偏官", 정관: "正官", 편인: "偏印", 정인: "正印",
  장생: "長生", 목욕: "沐浴", 관대: "冠帶", 건록: "建祿", 제왕: "帝旺",
  쇠: "衰", 병: "病", 사: "死", 묘: "墓", 절: "絶", 태: "胎", 양: "養",
  겁살: "劫殺", 재살: "災殺", 천살: "天殺", 지살: "地殺", 년살: "年殺",
  월살: "月殺", 망신살: "亡身殺", 장성살: "將星殺", 반안살: "攀鞍殺",
  역마살: "驛馬殺", 육해살: "六害殺", 화개살: "華蓋殺", 도화살: "桃花殺",
  홍염살: "紅艶殺",
  천을귀인: "天乙貴人", 태극귀인: "太極貴人", 문곡귀인: "文曲貴人",
  문창귀인: "文昌貴人", 복성귀인: "福星貴人", 천주귀인: "天廚貴人",
  천관귀인: "天官貴人", 천복귀인: "天福貴人", 학당귀인: "學堂貴人",
  재고귀인: "財庫貴人", 천덕귀인: "天德貴人", 월덕귀인: "月德貴人",
  암록: "暗祿", 금여: "金輿", 금여록: "金輿祿", 유하: "流霞", 협록: "夾祿",
  일간: "日干", 십성: "十星", 천간: "天干", 지지: "地支",
  십이운성: "十二運星", 신살: "神殺", 귀인: "貴人",
  시주: "時柱", 일주: "日柱", 월주: "月柱", 년주: "年柱",
};
function hh(n: string): string {
  const h = HANJA[n];
  return h ? `${h}<br><small>(${n})</small>` : n;
}
function hlist(ns: string[]): string {
  return ns.length ? ns.map(hh).join("<br>") : '<span class="dim">(없음)</span>';
}

// ── 오행 ────────────────────────────────────────────
const GAN_OH: Record<string, string> = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
const JI_OH: Record<string, string> = { 자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수" };
const JIJANGGAN: Record<string, [string, number][]> = {
  자: [["임", 10], ["계", 20]], 축: [["계", 9], ["신", 3], ["기", 18]],
  인: [["무", 7], ["병", 7], ["갑", 16]], 묘: [["갑", 10], ["을", 20]],
  진: [["을", 9], ["계", 3], ["무", 18]], 사: [["무", 7], ["경", 7], ["병", 16]],
  오: [["병", 10], ["기", 9], ["정", 11]], 미: [["정", 9], ["을", 3], ["기", 18]],
  신: [["무", 7], ["임", 7], ["경", 16]], 유: [["경", 10], ["신", 20]],
  술: [["신", 9], ["정", 3], ["무", 18]], 해: [["무", 7], ["갑", 7], ["임", 16]],
};
const OH_ORDER = ["목", "화", "토", "금", "수"] as const;
const OH_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

// ── 마크다운 → HTML ─────────────────────────────────
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const em = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>');
function renderBody(text: string): string {
  return text
    .split(/\n+/)
    .filter((p) => p.trim())
    .map((p) => {
      const m = p.match(/^#{2,4}\s*(.+)$/);
      return m
        ? `<h3 class="sub-h">${esc(m[1])}</h3>`
        : `<p class="para">${em(p)}</p>`;
    })
    .join("");
}
const nyan = (text: string) => `<div class="nyan"><span class="say">${text}</span></div>`;

// 연속 말풍선 그룹의 마지막 버블에 꼬리(tail) 부여
function addTails(doc: string): string {
  return doc.replace(/<div class="nyan">([\s\S]*?)<\/div>(?!\s*<div class="nyan")/g,
    '<div class="nyan tail">$1</div>');
}

// ── 컨텍스트 ────────────────────────────────────────
function buildBaseCtx(a: Api, name: string, job?: string): string {
  const g = a.ganji;
  const parts = [
    `[사주 원국] 년주 ${g.year.gan}${g.year.ji} / 월주 ${g.month.gan}${g.month.ji} / 일주 ${g.day.gan}${g.day.ji}` +
      (g.hour ? ` / 시주 ${g.hour.gan}${g.hour.ji}` : " (시주 미상)"),
    `[일간] ${g.day.gan} (${g.day.ohaeng?.gan}행, ${g.day.eumyang?.gan})`,
  ];
  if (a.sipseong?.sipseongs) {
    const sm = a.sipseong.summary ?? {};
    parts.push(`[십성] ${a.sipseong.sipseongs.map((s: Api) => `${s.position} ${s.sipseong}`).join(", ")} (비겁${sm.bigyeop ?? "-"} 식상${sm.siksang ?? "-"} 재성${sm.jaeseong ?? "-"} 관성${sm.gwanseong ?? "-"} 인성${sm.inseong ?? "-"})`);
  }
  if (a.sinStrength) {
    const s = a.sinStrength;
    parts.push(`[신강약] ${s.strength}(${s.score}점) 득령${s.deukryeong ? "O" : "X"} 득지${s.deukji ? "O" : "X"} 득세${s.deukse ? "O" : "X"}`);
  }
  if (a.gyeokguk) {
    const k = a.gyeokguk;
    parts.push(`[격국·용신] ${k.name}, 용신 ${k.yongsin?.오행}(${k.yongsin?.십신}), 희신 ${k.희신오행}, 기신 ${k.기신오행}`);
  }
  if (a.twelveFortune?.fortunes) {
    parts.push(`[12운성] ${a.twelveFortune.fortunes.map((f: Api) => `${f.position} ${f.fortune}`).join(", ")}`);
  }
  if (a.sibisinsals?.sibisinsals) {
    const extra = [
      ...(a.dohwa?.dohwa ?? []).map((x: Api) => `도화살(${x.position})`),
      ...(a.hwagae?.hwagae ?? []).map((x: Api) => `화개살(${x.position})`),
      ...(a.hongyeom?.hongyeom ?? []).map((x: Api) => `홍염살(${x.position})`),
    ];
    parts.push(`[신살] ${a.sibisinsals.sibisinsals.map((s: Api) => `${s.name}(${s.position} ${s.ji})`).join(", ")}${extra.length ? "; " + extra.join(", ") : ""}`);
  }
  if (a.guiin) {
    const gs = Object.values(a.guiin).flat().filter(Boolean) as Api[];
    parts.push(`[귀인] ${gs.map((x) => `${x.name}(${x.position} ${x.ji})`).join(", ") || "없음"}`);
  }
  if (Array.isArray(a.hapchung)) {
    parts.push(`[합충] ${a.hapchung.map((h: Api) => `${h.type}(${h.source}-${h.target}, ${h.sourcePosition}-${h.targetPosition})`).join(", ") || "없음"}`);
  }
  if (a.daeun?.all_daeun) {
    const d = a.daeun;
    parts.push(`[대운] ${d.direction}, ${d.daeun_start_age}세 시작, 현재 ${d.current_daeun?.ganji} 대운(${d.current_daeun?.age_start}~${d.current_daeun?.age_end}세) — 전체: ${d.all_daeun.map((x: Api) => `${x.age_start}세 ${x.ganji}(${x.sipseong?.gan}/${x.sipseong?.ji}, ${x.twelveFortune?.fortune ?? ""})`).join(" → ")}`);
  }
  if (job) {
    parts.push(`[현재 직업] ${job} — 직업운·재물운·연운 풀이의 생활 장면을 이 상황에 맞춘다.`);
  }
  parts.push(`[호칭] 내담자를 "${name}님"으로 부른다.`);
  return parts.join("\n");
}

function collectSeun(a: Api): Api[] {
  const all = [a.seun?.currentSeun, a.seun?.nextSeun, ...(a.seun?.upcomingSeuns ?? []), ...(a.seun?.recentSeuns ?? [])].filter(Boolean);
  const map = new Map<number, Api>();
  for (const s of all) map.set(Number(s.year), s);
  return [...map.entries()].sort((x, y) => x[0] - y[0]).map(([, v]) => v);
}
function seunCtx(a: Api, year: number): string {
  const s = collectSeun(a).find((x) => Number(x.year) === year);
  if (!s) return `[${year}년 세운] 자료 없음`;
  return `[${year}년 세운] ${s.ganji}(${s.ganji_hanja ?? ""}), 나이 ${s.age}세, 기운 ${s.sipseongRelation?.gan}/${s.sipseongRelation?.ji}, 12운성 ${s.twelveFortune?.fortune ?? "-"}, 오행 ${s.ganElement ?? "-"}/${s.jiElement ?? "-"}`;
}

// 삼재: 년지 삼합 그룹별 삼재 시작 지지(인신사해년 기준 단순 규칙)
const SAMJAE_START: Record<string, string> = {
  신: "인", 자: "인", 진: "인",   // 신자진생 → 인묘진년 삼재
  인: "신", 오: "신", 술: "신",   // 인오술생 → 신유술년 삼재
  사: "해", 유: "해", 축: "해",   // 사유축생 → 해자축년 삼재
  해: "사", 묘: "사", 미: "사",   // 해묘미생 → 사오미년 삼재
};
function findSamjae(a: Api, baseYear: number): { in_: number; mid: number; out: number } | null {
  const yearJi = a.ganji?.year?.ji;
  const startJi = SAMJAE_START[yearJi];
  if (!startJi) return null;
  // 올해부터 12년 안의 세운에서 시작 지지 해를 찾는다
  const seun = collectSeun(a);
  for (let y = baseYear; y < baseYear + 12; y++) {
    const s = seun.find((x) => Number(x.year) === y);
    const ji = s?.ganji?.slice(1, 2);
    if (ji === startJi) return { in_: y, mid: y + 1, out: y + 2 };
  }
  return null;
}

// ── 생성 잡 정의 ────────────────────────────────────
type Job = { key: string; brief: string; chars: string; extraCtx?: string };

function buildJobs(a: Api, name: string, currentYear: number): { jobs: Job[]; samjae: { in_: number; mid: number; out: number } | null; years: number[] } {
  const N = name;
  const jobs: Job[] = [];
  const push = (key: string, brief: string, chars: string, extraCtx?: string) =>
    jobs.push({ key, brief, chars, extraCtx });

  push("ch2-0", `제2장 나는 어떤 사람인가 — 일주(일간·일지)가 그리는 사람의 본질. 일간의 성질을 자연물에 비유해 깊게, 일지가 더하는 내면의 결까지. '### 나의 일간', '### 일지가 말하는 속마음' 소제목.`, "2,800~3,200");
  push("ch2-1", `제2장 — 오행 구성의 의미와 균형. 발달한 오행이 주는 힘, 부족한 오행이 만드는 갈증, 용신을 살리는 생활법. '### 나의 오행 지도', '### 부족한 기운 채우기' 소제목. 일주 얘기 반복 금지.`, "2,800~3,200");
  push("ch3-0", `제3장 십성 — 십성 분포 총평 + 사회적 관계에서의 모습 + 가족과의 관계(육친). '### 나의 십성', '### 사회 속의 나', '### 가족과 나' 세 소제목.`, "3,200~3,600");
  push("ch3-1", `제3장 — 십성으로 보는 시기별 인생 흐름. '### 초년기', '### 청년기', '### 중년기', '### 말년기' 네 소제목(뒤에 다른 문구 금지). 각 시기를 장면 묘사로 구체적으로. 앞 내용과 중복 금지.`, "3,200~3,600");
  push("ch4-0", `제4장 십이운성 — 개념을 계절에 비유해 설명하고, 네 기둥 각각의 12운성이 삶의 각 영역(뿌리·사회·나·말년)에서 뜻하는 바. '### 십이운성이란', '### 네 기둥의 에너지' 소제목.`, "2,800~3,200");
  push("ch4-1", `제4장 — 일지 12운성 중심 심층 풀이 + 에너지가 차오르는 때와 꺼지는 때의 신호, 리듬을 살리는 생활 조언. '### 나의 중심 에너지', '### 리듬을 타는 법' 소제목. 앞 파트 반복 금지.`, "2,600~3,000");
  push("ch5-0", `제5장 신살 — 이 사주의 신살 각각을 하나씩 '### 신살이름' 소제목으로 상세 풀이. 각 신살이 실제 생활 장면에서 어떻게 나타나는지.`, "3,000~3,400");
  push("ch5-1", `제5장 — 신살들의 조합이 만드는 시너지와 충돌, 위기 신호와 기회로 바꾸는 구체적 대처법. '### 신살들이 만나면', '### 기회로 바꾸는 법' 소제목. 개별 신살 설명 반복 금지.`, "2,400~2,800");
  push("ch6-0", `제6장 귀인 — 이 사주의 귀인 각각을 '### 귀인이름' 소제목으로 하나씩 상세 풀이. 각 귀인이 어떤 도움·사람·기회로 나타나는지. 귀인이 없다면 그 의미를 따뜻하게.`, "3,000~3,400");
  push("ch6-1", `제6장 — 귀인운을 실제로 살리는 법 — 귀인이 나타나는 자리(직장/모임/공부), 알아보는 눈, 관계를 지키는 태도. '### 귀인을 만나는 자리', '### 귀인을 지키는 법' 소제목. 개별 귀인 설명 반복 금지.`, "2,400~2,800");
  push("ch7-0", `제7장 재물운 — 돈 그릇의 크기와 성질, 돈이 들어오는 구조와 새는 구조를 사주 근거로 상세히. 구체적인 소비/수입 장면 묘사. '### 나의 돈 그릇', '### 들어오는 길과 새는 길' 소제목.`, "2,800~3,200");
  push("ch7-1", `제7장 — 인생 전체의 재물 흐름(대운 근거) — 돈이 모이기 시작하는 시기, 크게 움직이는 시기, 지켜야 하는 시기 + 투자·저축 전략. '### 재물의 큰 흐름', '### 나에게 맞는 돈 관리' 소제목.`, "2,600~3,000");
  push("ch8-0", `제8장 연애&결혼운 — 연애 스타일과 인연의 패턴 — 끌리는 사람 vs 잘 맞는 사람, 관계 초반·깊어질 때·갈등 시의 모습을 장면으로. '### 나의 연애 스타일', '### 끌림과 인연 사이' 소제목.`, "2,800~3,200");
  push("ch8-1", `제8장 — 배우자 자리(일지)로 보는 배우자상과 결혼 생활의 모습, 인연이 깊어지는 시기 흐름. '### 나의 배우자 자리', '### 결혼이라는 계절' 소제목. 연애 스타일 반복 금지.`, "2,600~3,000");
  push("ch9-0", `제9장 직업운 — 타고난 일의 성질 — 조직/독립, 전문/관리, 빛나는 환경과 무너지는 환경을 장면으로. 유리한 분야 구체 나열 포함. '### 나에게 맞는 일의 모양', '### 빛나는 자리, 지치는 자리' 소제목.`, "2,800~3,200");
  push("ch9-1", `제9장 — 커리어의 시간표 — 실력이 쌓이는 시기, 승진·이동의 흐름(대운 근거), 결정의 순간에 지켜야 할 기준. '### 커리어의 시간표', '### 결정의 기준' 소제목.`, "2,600~3,000");
  push("ch10-0", `제10장 건강운 — 오행 균형으로 보는 체질과 조심할 부위, 지치는 패턴의 신호. '### 나의 체질 지도', '### 몸이 보내는 신호' 소제목.`, "2,600~3,000");
  push("ch10-1", `제10장 — 시기별 건강 관리 포인트(대운·나이대 근거)와 나에게 맞는 회복 루틴·운동·습관 처방. '### 시기별 관리 포인트', '### 나만의 회복 루틴' 소제목.`, "2,400~2,800");

  // 제11장 — 대운별 개별 풀이 (과거/미래 2회)
  const allDaeun: Api[] = a.daeun?.all_daeun ?? [];
  const curIdx = Math.max(0, allDaeun.findIndex((x) => x.ganji === a.daeun?.current_daeun?.ganji));
  const splitIdx = Math.min(allDaeun.length, curIdx + 2); // 현재 대운까지 앞파트에 포함
  const daeunHead = (x: Api) => `### ${x.age_start}세~${x.age_start + 9}세 ${x.ganji}(${x.ganji_hanja ?? ""}) 대운`;
  const daeunCtxAll = allDaeun.map((x: Api) => `[${x.age_start}세 ${x.ganji} 대운] 십성 ${x.sipseong?.gan}/${x.sipseong?.ji}, 12운성 ${x.twelveFortune?.fortune}(${x.twelveFortune?.interpretation?.keyword ?? ""})`).join("\n");
  const mkDaeunBrief = (list: Api[], note: string) =>
    `제11장 시기별 대운 풀이 — 대운을 10년 단위로 하나씩 깊게. 반드시 아래 소제목을 이 순서로, 뒤에 다른 문구를 덧붙이지 말고 그대로 사용:\n${list.map(daeunHead).join("\n")}\n각 대운마다: 시기의 전체 분위기(그 대운의 십성·12운성 근거를 쉬운 말로), 일·돈·관계·마음의 구체적 장면, 조심할 것과 살릴 것. 각 소제목 아래 600~750자.${note}\n${daeunCtxAll}`;
  if (allDaeun.length) {
    push("ch11-0", mkDaeunBrief(allDaeun.slice(0, splitIdx), " 이미 지난 대운은 '그때 그랬던 이유'를 복기하는 톤으로, 현재 대운은 지금 한복판이므로 가장 깊게."), "3,000~3,600");
    if (allDaeun.length > splitIdx) {
      push("ch11-1", mkDaeunBrief(allDaeun.slice(splitIdx), " 아직 오지 않은 대운이므로 미래를 그려주는 톤으로. 노년 대운일수록 건강·관계 당부를 곁들일 것. 앞선 대운들과 중복 금지."), "3,000~3,600");
    }
  }

  // 제12장 — 연운 5년 + 삼재
  const years = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
  const samjae = findSamjae(a, currentYear);
  const yearBrief = (y: number, long: boolean) => {
    const sj = samjae
      ? y === samjae.in_ ? " 참고: 이 해는 삼재가 들어오는 '들삼재'이기도 함."
        : y === samjae.mid ? " 참고: 이 해는 삼재가 머무는 '눌삼재'."
          : y === samjae.out ? " 참고: 이 해는 삼재가 나가는 '날삼재'." : ""
      : "";
    return `제12장 — ${y}년 한 해의 연운 서사. 세운 간지·기운을 근거로 직장/돈/관계/건강의 구체적 장면을 그리며 이야기하듯. 좋은 흐름과 조심할 흐름을 모두. ${long ? "올해이므로 가장 깊고 길게." : "핵심 위주로."} 첫 소제목은 정확히 '### ${y}년 흐름' 만 사용, 추가 소제목 금지. 다른 해와 중복 금지.${sj}`;
  };
  push("y0", yearBrief(years[0], true), "3,600~4,000", seunCtx(a, years[0]));
  for (let i = 1; i < 5; i++) push(`y${i}`, yearBrief(years[i], false), "2,600~3,000", seunCtx(a, years[i]));
  if (samjae) {
    push("samjae", `제12장 삼재 총정리 — ${N}님의 삼재는 ${samjae.in_}~${samjae.out}년. 반드시 이 순서의 소제목: '### 나의 사주와 삼재'(사주 구조가 삼재를 어떻게 받는지), '### 들삼재 ${samjae.in_}년', '### 눌삼재 ${samjae.mid}년', '### 날삼재 ${samjae.out}년', '### 삼재를 지나는 법'(마무리 당부). 연운 장과 중복되지 않게 삼재 관점만.`, "2,600~3,000");
  }
  push("closing", `제13장 마치며 — 리포트 전체를 닫는 따뜻한 마무리와 당부 3가지. 새로운 풀이 내용 추가 금지. 소제목 없이 문단만.`, "1,000~1,300");

  return { jobs, samjae, years };
}

// ── 병렬 LLM 실행 ───────────────────────────────────
async function runJobs(jobs: Job[], baseCtx: string, name: string): Promise<{ results: Record<string, string>; provider: string; model: string }> {
  const SYSTEM = `당신은 사주를 쉽고 친근하게 풀어주는 냥점의 점술사입니다. 전문 용어(천간·지지·십성·대운 등)를 쓸 때는 반드시 쉬운 말로 풀어 설명합니다. 말투는 반드시 "~요" 체. 내담자를 "${name}님"으로 호칭하세요. 모든 해석에 사주 근거를 일상어로 녹여 쓰고, 핵심 문장은 장 전체에서 2개만 **문장** 형태로 강조하세요. 소제목이 필요하면 "### 소제목" 형식만 사용하고, 목록은 쓰지 마세요. 구체적인 생활 장면(직장·관계·돈 상황 예시)을 넣어 이야기처럼 서술하세요.`;

  let provider = "";
  let model = "";
  const one = async (job: Job): Promise<[string, string]> => {
    const user = `${baseCtx}\n${job.extraCtx ?? ""}\n\n---\n이번에 쓸 내용: ${job.brief}\n\n요구사항:\n- ${job.chars}자 분량\n- 문단 위주 서술, 목록 금지, 소제목은 지시된 경우만 "### " 사용\n- 사주 근거를 일상어로 최소 4회 녹일 것\n- **강조**는 전체에서 2개만`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await generateInterpretation({ system: SYSTEM, user });
        provider = res.provider;
        model = res.model;
        if (!res.text.trim()) throw new Error("빈 응답");
        return [job.key, res.text];
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    throw new Error(`[life-report] ${job.key} 생성 실패: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
  };

  const entries = await Promise.all(jobs.map(one));
  return { results: Object.fromEntries(entries), provider, model };
}

// ── 데이터 카드 조립 ────────────────────────────────
type Cards = ReturnType<typeof buildCards>;

function buildCards(a: Api, name: string, birthLabel: string, years: number[]) {
  const g = a.ganji;
  const cols: Api[] = [g.hour, g.day, g.month, g.year].filter(Boolean); // 시/일/월/년
  const hasHour = !!g.hour;
  const colNames = (hasHour ? ["시주", "일주", "월주", "년주"] : ["일주", "월주", "년주"]);
  const posGan = hasHour ? ["시간", "일간", "월간", "년간"] : ["일간", "월간", "년간"];
  const posJi = hasHour ? ["시지", "일지", "월지", "년지"] : ["일지", "월지", "년지"];

  const sipMap: Record<string, string> = {};
  for (const s of a.sipseong?.sipseongs ?? []) sipMap[s.position] = s.sipseong;
  const tfMap: Record<string, string> = {};
  for (const f of a.twelveFortune?.fortunes ?? []) tfMap[f.position] = f.fortune;

  const sinsalByPos: Record<string, string[]> = {};
  const pushSinsal = (pos: string, nm: string) => {
    (sinsalByPos[pos] ??= []).push(nm);
  };
  for (const s of a.sibisinsals?.sibisinsals ?? []) pushSinsal(s.position, s.name);
  for (const x of a.dohwa?.dohwa ?? []) pushSinsal(x.position, "도화살");
  for (const x of a.hwagae?.hwagae ?? []) pushSinsal(x.position, "화개살");
  for (const x of a.hongyeom?.hongyeom ?? []) pushSinsal(x.position, "홍염살");

  const guiinByPos: Record<string, string[]> = {};
  for (const x of (Object.values(a.guiin ?? {}).flat().filter(Boolean) as Api[])) {
    (guiinByPos[x.position] ??= []).push(x.name);
  }

  const bigCell = (c: Api, kind: "gan" | "ji") => {
    const hanja = kind === "gan" ? c.ganHanja : c.jiHanja;
    const kr = kind === "gan" ? c.gan : c.ji;
    const oh = kind === "gan" ? GAN_OH[kr] : JI_OH[kr];
    return `<td class="big el-${oh ?? ""}">${hanja}<span>${kr}</span></td>`;
  };

  const msRow = (label: string, cells: string[]) =>
    `<tr><th>${hh(label)}</th>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;

  const msRows = [
    `<tr><th class="corner"></th>${colNames.map((n) => `<th>${hh(n)}</th>`).join("")}</tr>`,
    msRow("십성", posGan.map((p) => (p === "일간" ? hh("일간") : hh(sipMap[p] ?? "-")))),
    `<tr><th>${hh("천간")}</th>${cols.map((c) => bigCell(c, "gan")).join("")}</tr>`,
    `<tr><th>${hh("지지")}</th>${cols.map((c) => bigCell(c, "ji")).join("")}</tr>`,
    msRow("십성", posJi.map((p) => hh(sipMap[p] ?? "-"))),
    msRow("십이운성", colNames.map((p) => hh(tfMap[p] ?? "-"))),
    msRow("신살", posJi.map((p) => hlist(sinsalByPos[p] ?? []))),
    msRow("귀인", (hasHour ? ["시지", "일지", "월지", "년지"] : ["일지", "월지", "년지"]).map((p, i) => {
      const gan = (hasHour ? ["시간", "일간", "월간", "년간"] : ["일간", "월간", "년간"])[i];
      return hlist([...(guiinByPos[p] ?? []), ...(guiinByPos[gan] ?? [])]);
    })),
  ];

  const myeongsikCard =
    `<section class="card"><h3 class="card-title">${name}님의 사주</h3>` +
    `<p class="card-sub">${birthLabel}</p>` +
    `<table class="tbl ms">${msRows.join("")}</table></section>`;

  // 특정 행/열 강조 명식표
  const msFocusCard = (rowName: string) => {
    const rows = msRows.map((r) => {
      const head = r.split("</th>")[0];
      return head.includes(`(${rowName})`) ? r.replace("<tr>", '<tr class="on">') : r;
    });
    return `<section class="card"><table class="tbl ms fs">${rows.join("")}</table></section>`;
  };
  const msFocusColCard = (colIdx: number) => {
    // colIdx: 1-base among 기둥 열 (일주 열 = hasHour ? 2 : 1)
    const rows = msRows.map((r, ri) => {
      let cnt = 0;
      return r.replace(/<t[dh][^>]*>/g, (m) => {
        const isHeaderRow = ri === 0;
        if (m.startsWith("<th") && (!isHeaderRow || m.includes("corner"))) return m;
        cnt += 1;
        if (cnt !== colIdx) return m;
        return m.includes('class="')
          ? m.replace('class="', 'class="on-c ')
          : m.replace(/^<(t[dh])/, '<$1 class="on-c"');
      });
    });
    return `<section class="card"><table class="tbl ms fscol">${rows.join("")}</table></section>`;
  };

  // 대운표
  const d = a.daeun ?? {};
  const allDaeun: Api[] = d.all_daeun ?? [];
  const curGanji = d.current_daeun?.ganji;
  const dcell = (x: Api, content: string, extra = "") => {
    const cls = (x.ganji === curGanji ? `cur ${extra}` : extra).trim();
    return `<td${cls ? ` class="${cls}"` : ""}>${content}</td>`;
  };
  const daeunCard = allDaeun.length
    ? `<section class="card"><h3 class="card-title">${name}님의 대운표</h3>` +
      `<p class="card-desc">${name}님의 대운 주기는 ${d.daeun_start_age}세부터 시작해 10년 주기로 찾아와요.</p>` +
      `<div class="daeun-scroll"><table class="daeun">` +
      `<tr><th>연도</th>${allDaeun.map((x) => dcell(x, String(x.year_start))).join("")}</tr>` +
      `<tr><th>나이</th>${allDaeun.map((x) => dcell(x, `${x.age_start}세`)).join("")}</tr>` +
      `<tr><th>대운</th>${allDaeun.map((x) => dcell(x, x.ganji, "gj")).join("")}</tr>` +
      `</table></div></section>`
    : "";

  // 세운표 (연운 5년)
  const seun = collectSeun(a).filter((s) => years.includes(Number(s.year)));
  const scell = (y: number, content: string, extra = "") => {
    const cls = (y === years[0] ? `cur ${extra}` : extra).trim();
    return `<td${cls ? ` class="${cls}"` : ""}>${content}</td>`;
  };
  const seunCard = seun.length
    ? `<section class="card"><h3 class="card-title">${name}님의 세운표</h3>` +
      `<p class="card-desc">해마다 바뀌는 한 해의 기운, 앞으로 5년의 세운이에요.</p>` +
      `<div class="daeun-scroll"><table class="daeun">` +
      `<tr><th>연도</th>${seun.map((s) => scell(Number(s.year), String(s.year))).join("")}</tr>` +
      `<tr><th>나이</th>${seun.map((s) => scell(Number(s.year), `${s.age}세`)).join("")}</tr>` +
      `<tr><th>세운</th>${seun.map((s) => scell(Number(s.year), s.ganji, "gj")).join("")}</tr>` +
      `<tr><th>기운</th>${seun.map((s) => scell(Number(s.year), `${s.sipseongRelation?.gan ?? "-"}·${s.sipseongRelation?.ji ?? "-"}`)).join("")}</tr>` +
      `</table></div></section>`
    : "";

  // 오행 개수/비율
  const ganLetters = cols.map((c) => c.gan);
  const jiLetters = cols.map((c) => c.ji);
  const counts: Record<string, number> = Object.fromEntries(OH_ORDER.map((o) => [o, 0]));
  for (const gl of ganLetters) if (GAN_OH[gl]) counts[GAN_OH[gl]] += 1;
  for (const jl of jiLetters) if (JI_OH[jl]) counts[JI_OH[jl]] += 1;
  const weights: Record<string, number> = Object.fromEntries(OH_ORDER.map((o) => [o, 0]));
  for (const gl of ganLetters) if (GAN_OH[gl]) weights[GAN_OH[gl]] += 30;
  for (const jl of jiLetters) for (const [gg, days] of JIJANGGAN[jl] ?? []) weights[GAN_OH[gg]] += days;
  const totalW = Object.values(weights).reduce((s, v) => s + v, 0) || 1;
  const pct: Record<string, number> = Object.fromEntries(OH_ORDER.map((o) => [o, Math.round((weights[o] / totalW) * 1000) / 10]));
  const ohLabel = (p: number) => (p >= 25 ? "발달" : p >= 10 ? "적정" : "부족");

  const ohChips = OH_ORDER.map((o) =>
    `<div class="oh-chip oc-${o}${counts[o] === 0 ? " zero" : ""}"><span class="oh-el">${OH_HANJA[o]}<small>${o}</small></span><span class="oh-badge">${counts[o]}</span></div>`,
  ).join("");
  const ohBars = OH_ORDER.map((o) =>
    `<div class="bar-row"><span class="bar-name">${o}<small>(${OH_HANJA[o]})</small></span>` +
    `<div class="bar-track"><div class="bar-fill oh-${o}" style="width:${pct[o]}%"></div></div>` +
    `<span class="bar-val">${pct[o]}% · <em>${ohLabel(pct[o])}</em></span></div>`,
  ).join("");

  const k = a.gyeokguk ?? {};
  const yong = k.yongsin?.오행 ?? "";
  const hee = k.희신오행 ?? "";
  const gi = k.기신오행 ?? "";
  const ysChip = (role: string, oh: string, main = false) =>
    oh
      ? `<div class="ys-chip yc-${oh}${main ? " main" : ""}"><span class="ys-badge">${role}</span><span class="ys-h">${OH_HANJA[oh] ?? oh}</span><span class="ys-k">${oh}</span></div>`
      : "";
  const ysChips = `<div class="ys-chips">${ysChip("용신", yong, true)}${ysChip("희신", hee)}${ysChip("기신", gi)}</div>`;

  const ohengCardFull =
    `<section class="card"><h3 class="card-title">${name}님의 오행 &amp; 용신</h3>` +
    `<h4 class="sub-h">오행 분포 — 겉으로 보이는 오행의 개수</h4>` +
    `<p class="sub-note">천간과 지지 여덟 글자를 오행별로 세어 본 숫자예요.</p>` +
    `<div class="oh-chips">${ohChips}</div>` +
    `<h4 class="sub-h">오행 비율 — 사주 속 오행의 실제 강약</h4>` +
    `<p class="sub-note">지지 속에 숨어 있는 기운(지장간)까지 반영해 계산한 실제 세기예요.</p>` +
    `<div class="bars oh-bars">${ohBars}</div>` +
    `<h4 class="sub-h">용신 · 희신 · 기신</h4>` +
    `<p class="sub-note">사주의 균형을 잡아 주는 오행(용신)과 돕는 오행(희신), 조심할 오행(기신)이에요.</p>` +
    ysChips +
    `</section>`;
  const ohengCardCompact = ohengCardFull
    .replace(`<h3 class="card-title">${name}님의 오행 &amp; 용신</h3>`, "")
    .replace('<section class="card">', '<section class="card nt">');

  // 신강신약 슬라이더
  const GAUGE = ["극약", "태약", "신약", "중화", "신강", "태강", "극왕"];
  const strength = a.sinStrength?.strength ?? "중화";
  const gi2 = Math.max(0, GAUGE.indexOf(strength));
  const gPos = ((gi2 + 0.5) / GAUGE.length) * 100;
  const dayGan = g.day.gan;
  const singangCard =
    `<section class="card"><h3 class="card-title">신강신약</h3>` +
    `<div class="gauge"><div class="g-lab"><span class="g-cur" style="left:${gPos.toFixed(1)}%">${strength}</span></div>` +
    `<div class="g-track"><span class="g-dot" style="left:${gPos.toFixed(1)}%"></span></div>` +
    `<div class="g-ends"><span>극약</span><span>중화</span><span>극왕</span></div></div>` +
    `<p class="para">일간 '${dayGan}(${g.day.ganHanja})', <strong>${strength}</strong>한 사주예요.</p></section>`;

  const coverPillars = cols.map((c) => `<span>${c.ganHanja}<br>${c.jiHanja}</span>`).join("");

  return {
    myeongsikCard, msFocusCard, msFocusColCard, daeunCard, seunCard,
    ohengCardFull, ohengCardCompact, singangCard, coverPillars, hasHour,
  };
}

// ── 뷰 조립 ─────────────────────────────────────────
function assembleViews(
  a: Api,
  name: string,
  birthLabel: string,
  parts: Record<string, string>,
  samjae: { in_: number; mid: number; out: number } | null,
  years: number[],
): LifeView[] {
  const cards = buildCards(a, name, birthLabel, years) as Cards;
  const views: LifeView[] = [];
  const R = (key: string) => renderBody(parts[key] ?? "");

  // 표지
  views.push({
    label: "",
    title: "표지",
    html:
      `<div class="cover-view cover-typo"><p class="brand">냥점 🐱</p>` +
      `<h1 class="cover-title">인생 사주</h1><p class="sub">${name}님의 평생 리포트</p>` +
      `<div class="cover-pillars">${cards.coverPillars}</div>` +
      `<p class="meta">${birthLabel}</p>` +
      `<button class="start-btn" data-go="1">리포트 읽기 시작</button></div>`,
  });

  // 1장 — 나의 사주팔자 (데이터 카드)
  views.push({
    label: "1장",
    title: "나의 사주팔자",
    html: [
      nyan(`안녕하세요, ${name}님. 냥점의 점술사 묘묘예요. 이렇게 인연이 닿아 정말 기뻐요.`),
      nyan(`오늘은 ${name}님이 타고난 여덟 글자를 펼쳐 놓고, 그 안에 담긴 이야기를 처음부터 끝까지 들려드릴게요.`),
      nyan("먼저 제가 보기 쉽게 표로 정리했어요."),
      cards.myeongsikCard,
      `<p class="caption">${name}님의 생년월일시에 해당하는 하늘과 땅의 글자를 십성, 십이운성, 신살, 귀인과 함께 적은 표예요.</p>`,
      nyan("다음은 10년마다 바뀌는 운의 큰 흐름, 대운이에요."),
      cards.daeunCard,
      nyan(`이번엔 ${name}님의 오행과 기운의 세기를 볼게요.`),
      cards.ohengCardFull,
      cards.singangCard,
      nyan("이제 풀이 준비와 설명이 끝났어요."),
      nyan(`다음 장에서는 ${name}님이 어떤 사람인지 알려주는 '일주(日柱)'와 '오행(五行)'을 분석해 볼게요.`),
    ].join(""),
  });

  const ilJuCol = cards.hasHour ? 2 : 1;
  const ch = (label: string, title: string, blocks: string[]) =>
    views.push({ label, title, html: blocks.join("") });

  ch("2장", "나는 어떤 사람인가 — 일주와 오행", [
    nyan(`먼저 여덟 글자의 중심, ${name}님 그 자체를 뜻하는 '일주(日柱)'부터 볼게요.`),
    cards.msFocusColCard(ilJuCol),
    R("ch2-0"),
    nyan(`일주를 봤으니, 이번엔 ${name}님을 이루는 다섯 가지 기운, '오행(五行)'을 볼게요.`),
    cards.ohengCardCompact,
    R("ch2-1"),
    nyan(`다음 장에서는 ${name}님이 세상을 살아가는 방식, '십성(十星)'을 볼게요.`),
  ]);

  ch("3장", "내가 세상을 살아가는 방법 — 십성", [
    nyan(`이번엔 ${name}님이 세상과 관계 맺는 방식, '십성(十星)'이에요.`),
    cards.msFocusCard("십성"),
    R("ch3-0"),
    nyan(`이제 십성(十星)의 흐름을 따라, ${name}님의 인생을 초년기부터 말년기까지 시기별로 풀어볼게요.`),
    R("ch3-1"),
    nyan(`다음 장에서는 운의 에너지 단계인 '십이운성(十二運星)'을 볼게요.`),
  ]);

  ch("4장", "나의 운은 이렇게 흐른다 — 십이운성", [
    nyan(`이번 장은 기운의 계절, '십이운성(十二運星)' 이야기예요.`),
    cards.msFocusCard("십이운성"),
    R("ch4-0"), R("ch4-1"),
    nyan(`다음 장에서는 조심할 기운, '신살(神殺)'을 볼게요.`),
  ]);

  ch("5장", "위기 또는 기회 — 신살", [
    nyan(`사주 속 특별한 기운, '신살(神殺)'을 볼 차례예요.`),
    cards.msFocusCard("신살"),
    R("ch5-0"), R("ch5-1"),
    nyan(`다음 장에서는 ${name}님을 도와주는 '귀인(貴人)'들을 소개할게요.`),
  ]);

  ch("6장", "나를 도와주는 별 — 귀인", [
    nyan(`${name}님 곁의 든든한 조력자, '귀인(貴人)'이에요.`),
    cards.msFocusCard("귀인"),
    R("ch6-0"), R("ch6-1"),
    nyan("이제 모두가 궁금한 '재물운'으로 가 볼게요."),
  ]);

  ch("7장", "재물운", [
    nyan("돈은 언제, 어떻게 들어올까요? 재물운이에요."),
    R("ch7-0"), R("ch7-1"),
    nyan("다음은 사랑 이야기, '연애&결혼운'이에요."),
  ]);

  ch("8장", "연애 & 결혼운", [
    nyan(`이번 장은 ${name}님의 사랑의 모양이에요.`),
    R("ch8-0"), R("ch8-1"),
    nyan("다음 장에서는 '직업운'을 볼게요."),
  ]);

  ch("9장", "직업운", [
    nyan("일에서 빛나는 조건, '직업운'이에요."),
    R("ch9-0"), R("ch9-1"),
    nyan("다음 장에서는 몸과 마음, '건강운'을 볼게요."),
  ]);

  ch("10장", "건강운", [
    nyan("오래 잘 살기 위한 이야기, '건강운'이에요."),
    R("ch10-0"), R("ch10-1"),
    nyan(`이제 인생의 큰 물결, '대운(大運)'으로 가요.`),
  ]);

  ch("11장", "인생의 큰 물결 — 대운", [
    nyan(`10년마다 바뀌는 운의 계절, '대운(大運)'이에요.`),
    cards.daeunCard,
    R("ch11-0"), R("ch11-1"),
    nyan(`다음 장은 하이라이트, '앞으로 5년'입니다.`),
  ]);

  const ch12: string[] = [
    nyan(`이제 이 리포트의 하이라이트, 앞으로 5년의 '연운(年運)' 이야기예요.`),
    cards.seunCard,
  ];
  for (let i = 0; i < 5; i++) ch12.push(R(`y${i}`));
  if (samjae && parts["samjae"]) {
    ch12.push(nyan(`마지막으로, ${samjae.in_}년부터 ${samjae.out}년까지 3년간 이어지는 '삼재(三災)' 이야기를 들려드릴게요.`));
    ch12.push(R("samjae"));
  }
  ch("12장", "앞으로 5년 — 연운과 삼재", ch12);

  ch("13장", "마치며", [R("closing")]);

  return views.map((v) => ({ ...v, html: addTails(v.html) }));
}

// ── 진입점 ──────────────────────────────────────────
export async function generateLifeReport(
  analysis: SajuAnalysisResponse,
  opts: { name: string; birthDate: string; birthTime: string | null; timeUnknown: boolean; calendar: "solar" | "lunar"; gender: "male" | "female"; job?: string },
): Promise<{ payload: LifeReportPayload; provider: string; model: string }> {
  const a = analysis as Api;
  if (!a?.ganji?.day) throw new Error("인생 사주 생성에는 만세력 풀 분석(ganji)이 필요합니다");

  const name = opts.name?.trim() || "고객";
  const [y, m, d] = opts.birthDate.split("-").map((x) => parseInt(x, 10));
  const timePart = !opts.timeUnknown && opts.birthTime ? ` ${opts.birthTime.slice(0, 5)}` : "";
  const birthLabel = `${y}년 ${m}월 ${d}일${timePart} (${opts.calendar === "lunar" ? "음력" : "양력"}) · ${opts.gender === "male" ? "남성" : "여성"}`;

  const currentYear = Number((analysis as Api).seun?.currentSeun?.year ?? new Date().getFullYear());

  const baseCtx = buildBaseCtx(a, name, opts.job);
  const { jobs, samjae, years } = buildJobs(a, name, currentYear);
  const { results, provider, model } = await runJobs(jobs, baseCtx, name);
  const views = assembleViews(a, name, birthLabel, results, samjae, years);

  return {
    payload: { type: LIFE_PAYLOAD_TYPE, name, birthLabel, views },
    provider,
    model,
  };
}
