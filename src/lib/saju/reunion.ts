// =====================================================
// 재회 사주 v2 — 고정 목차(프롤로그+7장) 프롬프트 + 북 뷰어 페이로드
// =====================================================
// 구성은 장별 고정, 디자인·말투는 냥점 스타일(묘묘 존댓말 "~요" + 절취선 북 뷰어).
// LLM 출력 맨 앞의 [점수] 블록을 파싱해 게이지·캘린더 위젯을 코드에서 렌더한다.

import { SYSTEM_BASE, makeContext, type PromptInput } from "@/lib/saju/prompt";
import type { LifeReportPayload } from "@/lib/saju/life-report";
import type { Myeongsik } from "@/lib/saju/manseryeok";

// ─── 프롬프트 ─────────────────────────────────────────

export const REUNION_CHAPTERS = [
  "우리는 어떤 두 사람이었을까",
  "이별의 진짜 이유",
  "지금, 그 사람의 마음",
  "다시 이어지는 시기",
  "다시 만난다면",
  "만약 놓아준다면",
  "묘묘의 마지막 편지",
] as const;

export function buildReunionPromptV2(input: PromptInput): { system: string; user: string } {
  // 태그([상대방]·[연애 기간] 등)는 아래 전용 섹션으로 정리하므로 공통 컨텍스트의 고민란에서는 제외
  const ctx = makeContext({ ...input, concerns: input.concerns.filter((c) => !c.startsWith("[")) });
  const concern = input.concerns
    .map((c) => c.replace(/^\[질문\]\s*/, ""))
    .filter((c) => !c.startsWith("["))
    .join(" ");

  // 입력폼 태그([연애 기간] 등)에서 이별 상황 정보 추출
  const tag = (label: string) => {
    const found = input.concerns.find((c) => c.startsWith(`[${label}]`));
    return found ? found.slice(label.length + 2).trim() : null;
  };
  const loveDuration = tag("연애 기간");
  const breakupAgo = tag("이별한 지");
  const breakupCause = tag("이별 원인");
  const breakupBy = tag("이별 통보한 쪽");
  const feeling = tag("지금 마음");
  const notYetBroken = breakupAgo === "아직 헤어지진 않았어요";
  const situationLines = [
    loveDuration && `- 연애 기간: ${loveDuration}`,
    breakupAgo && `- 이별한 지: ${breakupAgo}`,
    breakupCause && `- 이별의 원인: ${breakupCause}`,
    breakupBy && `- 이별을 통보한 쪽: ${breakupBy}${breakupBy === "나" ? " (내담자)" : breakupBy === "상대" ? " (그 사람)" : ""}`,
    feeling && `- 지금 내담자의 마음: ${feeling}`,
  ].filter(Boolean);
  const situationSection = situationLines.length > 0
    ? `\n[이별 상황 정보 — 내담자가 입력폼에서 직접 선택한 사실]\n${situationLines.join("\n")}\n`
    : "";

  const p = input.partnerMyeongsik;
  const partnerName = input.partnerName?.trim() || null;
  const partnerCall = partnerName ? `${partnerName}님` : "그 사람";
  const pil = (x: { cheongan: string; jiji: string } | null) => (x ? `${x.cheongan}${x.jiji}` : "(시 미상)");
  const partnerSection = p
    ? `
[헤어진 상대방 정보]
${partnerName ? `- 이름: ${partnerName}\n` : ""}- 생년월일: ${input.partnerBirthDate ?? "미상"}${input.partnerGender ? ` · ${input.partnerGender === "male" ? "남성" : "여성"}` : ""}
- 상대방 사주 4기둥: 년주 ${pil(p.year)} / 월주 ${pil(p.month)} / 일주 ${pil(p.day)} / 시주 ${pil(p.hour)}
`
    : "";
  const partnerRule = p
    ? `- 상대방 사주 4기둥이 제공되었습니다. 성향·궁합·상대의 마음·재회 판단에 반드시 두 사람의 사주를 함께 분석하고, 상대방 사주 근거도 일상어로 풀어 쓰세요.`
    : `- 상대방의 생년월일은 제공되지 않았습니다. "그 사람" 관련 섹션은 내담자 사주에 드러난 관계·인연의 기운을 근거로 조심스럽게 서술하고, 상대 사주를 아는 것처럼 단정하지 마세요. "두 사람의 궁합" 섹션은 생략하세요.`;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const user = `${ctx}
${partnerSection}${situationSection}
---
내담자가 마지막으로 남긴 질문: "${concern || "(별도 질문 없음 — 재회 가능성이 가장 궁금한 상태)"}"
오늘 날짜: ${todayStr}

내담자는 헤어진 상대와의 재회를 간절히 바라며 찾아온 사람입니다. 아래에 정해 준 고정 목차 그대로, 재회 사주 결과지를 작성해 주세요.

⚠️ 출력 형식 (정확히 지키세요):
맨 처음에 반드시 아래 점수 블록을 출력하세요. 모든 점수는 사주와 운의 흐름을 근거로 산출한 0~100 정수이고, 본문 서술과 반드시 일치해야 합니다.

[점수]
재회가능성: NN
상대마음: NN
인연궁합: NN
재회후관계: NN
새인연: NN
골든타임: YYYY-MM-DD NN% / YYYY-MM-DD NN% / YYYY-MM-DD NN%
[/점수]

- 골든타임은 오늘(${todayStr}) 이후 90일 이내의 서로 다른 날짜 3개, 확률 높은 순으로 쓰세요.

그 다음, 아래 7개 장을 정확히 이 순서·이 제목 그대로 "## 제목" 형식으로 작성하세요 (제목을 바꾸거나 장을 더하거나 빼면 안 됩니다). 각 장 안의 소제목은 "### 소제목" 형식으로, 지정된 소제목을 그대로 쓰세요.

## 우리는 어떤 두 사람이었을까
### 내가 타고난 성향
### 나의 연애 스타일
### 그 사람이 타고난 성향
### 그 사람의 연애 스타일
### 두 사람의 궁합
### 우리의 연애는 어땠을까

## 이별의 진짜 이유
### 연애 중 갈등의 뿌리
### 이별의 진짜 원인
### 이별 때 나도 몰랐던 내 마음
### 이별 전후, 그 사람의 마음

## 지금, 그 사람의 마음
### 그 사람의 요즘
### 곁에 다가올 수 있는 사람
### 재회에 대한 그 사람의 생각
### 망설이는 이유

## 다시 이어지는 시기
### 재회 확률이 올라가는 골든타임
### 어떻게 다가가면 좋을까
### 다가가기 전, 마음가짐
### 만나기 좋은 장소
### 행운을 더하는 스타일
### 하지 말아야 할 행동

## 다시 만난다면
### 다시 만난 뒤의 흐름
### 조심해야 할 시기
### 결혼까지 간다면
### 오래가기 위한 조언
### 갈등이 생겼을 때

## 만약 놓아준다면
### 새로 다가올 인연
### 다음 연애의 시기
### 그 인연에게 다가가는 법
### 재회와 새 인연, 솔직한 비교

## 묘묘의 마지막 편지
(이 장만 소제목 없이 편지 형식의 문단으로 작성)

⚠️ 내용 규칙:
${partnerRule}
${partnerName ? `- 상대방을 부를 때는 "그 사람" 대신 "${partnerCall}"이라고 자연스럽게 부르세요 (장 제목은 지정된 그대로 유지).` : ""}
${situationLines.length > 0 ? `- [이별 상황 정보]는 내담자가 직접 선택한 사실입니다. 사주 해석과 반드시 연결해 쓰세요: 연애 기간·이별 시점은 "이별의 진짜 이유"와 "다시 이어지는 시기"의 근거로, 이별 원인·통보한 쪽은 "이별의 진짜 이유"와 "지금, 그 사람의 마음"에서 사주에 드러난 갈등의 기운과 맞물려 설명하세요. 상황 정보와 모순되는 서술(예: 상대가 통보했는데 내담자가 찼다는 식)은 절대 금지합니다.` : ""}
${notYetBroken ? `- 내담자는 아직 완전히 헤어진 상태가 아닙니다(이별 직전·갈등 중). "재회"는 "멀어진 마음을 되돌리는 관계 회복"으로 해석해 쓰고, 골든타임도 화해의 타이밍으로 서술하세요.` : ""}
${feeling ? `- 지금 내담자의 마음("${feeling}")에 맞춰 전체 톤을 조절하세요: 재회를 원하면 다가가는 전략을 두텁게, 미움·상처가 큰 상태면 감정을 먼저 다독인 뒤 판단을 돕고, 새 인연이 궁금한 상태면 "만약 놓아준다면" 장과 솔직한 비교를 특히 충실하게 쓰세요. "묘묘의 마지막 편지"에서도 이 마음을 직접 언급하며 답해 주세요.` : ""}
${concern ? `- 내담자가 남긴 질문에는 가장 관련 있는 장에서 직접 답하고, "묘묘의 마지막 편지"에서 한 번 더 짚어 주세요.` : ""}
- 각 ### 소제목 본문은 350~550자로 작성하세요. 첫 문장에 결론을 먼저 말하고, 사주 근거(오행 비유·기운의 충돌/합 등)를 일상어로 풀고, 현실 생활 예시를 1개 이상 넣으세요.
- "재회 확률이 올라가는 골든타임" 본문에서는 점수 블록에 적은 골든타임 날짜 3개를 그대로, 각 날짜의 확률 %와 함께 왜 그 날인지 이유를 서술하세요 (이 섹션은 700자까지 허용).
- "곁에 다가올 수 있는 사람"과 "새로 다가올 인연"에서는 상대의 분위기·스타일과 만나게 될 법한 장소를 구체적으로 묘사하되, 키·신체 수치 같은 단정은 피하세요.
- "어떻게 다가가면 좋을까"에는 연락 수단 추천, 연락이 막혀 있을 때의 대응, 실제로 보낼 만한 짧은 멘트 예시 1개를 포함하세요.
- "하지 말아야 할 행동" 본문에서만 예외적으로 불릿(-)을 사용해 3~4가지를 제시하고, 각 행동마다 사주 근거를 짧게 덧붙이세요.
- "재회와 새 인연, 솔직한 비교"에서는 양쪽의 장단점을 짚고 운의 흐름상 어느 쪽이 나은지 분명하게 권하세요. 애매한 양다리 결론은 금지합니다.
- "재회에 대한 그 사람의 생각" 본문에서 상대마음 점수(NN점)를 자연스럽게 언급하세요.
- "다음 연애의 시기", "조심해야 할 시기", "결혼까지 간다면"에는 반드시 구체적인 연도·월(또는 분기)을 제시하고 이유를 서술하세요.
- "이별 때 나도 몰랐던 내 마음"은 내담자 스스로 몰랐던 무의식의 감정(해방감·안도감·미련의 실체 등)을 사주 근거로 짚어 주세요.
- "묘묘의 마지막 편지"는 700~1000자: 재회 가능성 점수를 다시 언급하며 총평 → 앞으로 벌어질 법한 시나리오 → 어떤 선택을 하든 내담자를 따뜻하게 응원하는 마무리. 재회가 어렵다는 결론이어도 다그치지 말고 위로가 되게 쓰세요.
- 각 장의 첫 소제목 본문 안에서 그 장의 핵심 결론 문장 1~2개를 **문장** 형태로 강조하세요. 재회 확률·시기·판정 문장은 반드시 강조하세요.
- 전문 용어(천간, 지지, 십성, 재성 등)는 쓰지 말고 일상 언어로 풀어 설명하세요.
- 말투는 반드시 "~요" 체의 따뜻한 존댓말로, 내담자는 "${input.name ?? "고객"}님"으로 부르세요. 반말은 절대 쓰지 마세요.
- 점수 블록의 숫자와 본문 서술(확률·점수 언급)은 반드시 일치해야 합니다.

⚠️ 출력 전 자가 점검 (하나라도 어긋나면 다시 쓰세요):
1. 맨 앞에 [점수] 블록이 형식 그대로 있는가? 골든타임 3개가 오늘 이후 90일 이내인가?
2. ## 장 7개가 지정한 제목·순서 그대로인가? ### 소제목이 지정한 것과 일치하는가?
3. 골든타임 섹션의 날짜·%가 점수 블록과 일치하는가?
4. 반말 없이 전부 "~요" 체 존댓말인가?`;

  return { system: SYSTEM_BASE, user };
}

// ─── 점수 블록 파싱 ────────────────────────────────────

export type ReunionScores = {
  reunion: number;      // 재회 가능성
  partnerMind: number;  // 상대의 재회 마음
  chemistry: number;    // 인연 궁합
  afterReunion: number; // 재회 후 관계
  newLove: number;      // 새 인연 가능성
  golden: { date: string; pct: number }[];
};

export function parseReunionScores(md: string): { scores: ReunionScores | null; body: string } {
  const m = md.match(/\[점수\]([\s\S]*?)\[\/점수\]/);
  if (!m) return { scores: null, body: md };
  const block = m[1];
  const num = (label: string) => {
    const mm = block.match(new RegExp(`${label}\\s*[:：]\\s*(\\d{1,3})`));
    return mm ? Math.min(100, parseInt(mm[1])) : null;
  };
  const golden: { date: string; pct: number }[] = [];
  const gm = block.match(/골든타임\s*[:：]([^\n]+)/);
  if (gm) {
    for (const part of gm[1].split("/")) {
      const dm = part.match(/(\d{4}-\d{2}-\d{2})\s*(\d{1,3})\s*%/);
      if (dm) golden.push({ date: dm[1], pct: Math.min(100, parseInt(dm[2])) });
    }
  }
  const reunion = num("재회가능성");
  const partnerMind = num("상대마음");
  const chemistry = num("인연궁합");
  const afterReunion = num("재회후관계");
  const newLove = num("새인연");
  const body = md.replace(m[0], "").trim();
  if (reunion === null) return { scores: null, body };
  return {
    scores: {
      reunion,
      partnerMind: partnerMind ?? reunion,
      chemistry: chemistry ?? reunion,
      afterReunion: afterReunion ?? reunion,
      newLove: newLove ?? 50,
      golden,
    },
    body,
  };
}

// ─── 페이로드 빌더 ────────────────────────────────────

const CHEONGAN_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
const JIJI_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    // LLM이 ISO 형식(2026-10-12)으로 쓴 날짜를 한국어 표기로 변환
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y, m, d) => `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>');
}

/** ### 소제목 + 문단 + 불릿을 뷰어 html 로 */
function bodyHtml(text: string): string {
  const out: string[] = [];
  for (const raw of text.split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    if (block.startsWith("### ")) {
      // 블록 첫 줄이 소제목, 나머지는 문단
      const [head, ...rest] = block.split("\n");
      out.push(`<p class="sub-h">${inline(head.slice(4).trim())}</p>`);
      const restText = rest.join("\n").trim();
      if (restText) out.push(...paraOrList(restText));
    } else {
      out.push(...paraOrList(block));
    }
  }
  return out.join("");
}

function paraOrList(block: string): string[] {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  const isList = lines.every((l) => l.startsWith("- "));
  if (isList) {
    return [`<ul class="dolist">${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`];
  }
  return [`<p class="para">${inline(lines.join(" "))}</p>`];
}

/** 간이 명식표 (상대방용 — 천간·지지 2행) */
function simpleMsCard(title: string, subtitle: string, ms: Myeongsik): string {
  const pillars = [
    { hj: "時柱", kr: "시주", p: ms.hour },
    { hj: "日柱", kr: "일주", p: ms.day },
    { hj: "月柱", kr: "월주", p: ms.month },
    { hj: "年柱", kr: "년주", p: ms.year },
  ].filter((c) => c.p !== null);
  const head = pillars.map((c) => `<th>${c.hj}<small>(${c.kr})</small></th>`).join("");
  const gan = pillars
    .map((c) => `<td class="big">${CHEONGAN_HANJA[c.p!.cheongan] ?? c.p!.cheongan}<span>${esc(c.p!.cheongan)}</span></td>`)
    .join("");
  const ji = pillars
    .map((c) => `<td class="big">${JIJI_HANJA[c.p!.jiji] ?? c.p!.jiji}<span>${esc(c.p!.jiji)}</span></td>`)
    .join("");
  return `<div class="card">
<p class="card-title">${esc(title)}</p>
<p class="card-sub">${esc(subtitle)}</p>
<table class="tbl ms">
<tr><th class="corner"></th>${head}</tr>
<tr><th>天干<small>(천간)</small></th>${gan}</tr>
<tr><th>地支<small>(지지)</small></th>${ji}</tr>
</table>
</div>`;
}

/** 큰 점수 게이지 카드 */
function gaugeCard(title: string, score: number, caption: string): string {
  return `<div class="card gauge-card">
<p class="card-title">${esc(title)}</p>
<p class="gauge-num">${score}<small>점</small></p>
<div class="gauge-track"><div class="gauge-fill" style="width:${score}%"></div></div>
<p class="gauge-cap">${esc(caption)}</p>
</div>`;
}

/** 미니 게이지 3종 카드 (프롤로그) */
function miniGaugesCard(items: { label: string; score: number }[]): string {
  const rows = items
    .map(
      (it) => `<div class="mini-g">
<span class="mini-g-label">${esc(it.label)}</span>
<div class="gauge-track sm"><div class="gauge-fill" style="width:${it.score}%"></div></div>
<span class="mini-g-num">${it.score}</span>
</div>`,
    )
    .join("");
  return `<div class="card">${rows}</div>`;
}

function reunionCaption(score: number): string {
  if (score >= 70) return "다시 이어질 흐름이 열려 있어요.";
  if (score >= 50) return "가능성은 있지만, 다가가는 방법이 중요해요.";
  if (score >= 30) return "다시 만나려면 정성과 시간이 필요해요.";
  return "이 인연은 놓아주는 쪽이 편할 수 있어요.";
}

/** 골든타임 캘린더 카드 — 날짜가 속한 달들을 달력으로 그리고 해당 날짜에 표식 */
function calendarCard(golden: { date: string; pct: number }[]): string {
  if (golden.length === 0) return "";
  const byMonth = new Map<string, { day: number; pct: number }[]>();
  for (const g of golden) {
    const [y, m, d] = g.date.split("-").map(Number);
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push({ day: d, pct: g.pct });
  }
  const months = [...byMonth.keys()].sort().slice(0, 3);
  const tables = months
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      const marks = new Map(byMonth.get(key)!.map((x) => [x.day, x.pct]));
      const first = new Date(y, m - 1, 1);
      const daysInMonth = new Date(y, m, 0).getDate();
      let cells = "";
      let row = "";
      for (let i = 0; i < first.getDay(); i++) row += "<td></td>";
      for (let d = 1; d <= daysInMonth; d++) {
        const pct = marks.get(d);
        row += pct !== undefined
          ? `<td><span class="cal-hit">${d}</span><span class="cal-pct">${pct}%</span></td>`
          : `<td>${d}</td>`;
        if ((first.getDay() + d) % 7 === 0) { cells += `<tr>${row}</tr>`; row = ""; }
      }
      if (row) cells += `<tr>${row}</tr>`;
      return `<div class="cal">
<p class="cal-title">${y}년 ${m}월</p>
<table class="cal-tbl">
<tr><th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th></tr>
${cells}
</table>
</div>`;
    })
    .join("");
  return `<div class="card"><p class="card-title">재회의 문이 열리는 날</p>${tables}</div>`;
}

export function buildReunionBookPayload(opts: {
  name: string;
  birthLabel: string;
  question: string | null;
  myeongsik: Myeongsik;
  md: string;
  myeongsikCardHtml?: string;
  partnerMyeongsik?: Myeongsik;
  partnerName?: string;
  partnerBirthDate?: string;
  partnerGender?: "male" | "female";
  /** 상대방 풀 명식표 html — 있으면 간이 명식표 대신 사용 */
  partnerMsCardHtml?: string;
}): LifeReportPayload {
  const { name, birthLabel, question, myeongsik, md, myeongsikCardHtml } = opts;
  const { scores, body } = parseReunionScores(md);

  // '## ' 장 분리
  const sections: { title: string; body: string }[] = [];
  for (const part of body.split(/\n(?=## )/)) {
    const m = part.match(/^## (.+)\n?([\s\S]*)$/);
    if (m) sections.push({ title: m[1].trim(), body: m[2].trim() });
  }

  const views: LifeReportPayload["views"] = [];
  const no = (n: number) => String(n).padStart(2, "0");
  const dot = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);

  // ── 프롤로그 — 묘묘의 인사 + 재회 가능성 게이지 + 명식표 ──
  const partnerLabel = opts.partnerBirthDate
    ? `${opts.partnerBirthDate.replace(/-/g, ". ")}${opts.partnerGender ? ` · ${opts.partnerGender === "male" ? "남성" : "여성"}` : ""}`
    : "";
  const prologueParts: string[] = [
    `<div class="nyan tail"><span class="say">안녕하세요, ${esc(name)}님. 냥점의 점술사 묘묘예요.</span></div>`,
    `<div class="nyan"><span class="say">보내주신 이별 이야기, 제가 찬찬히 들여다봤어요.</span></div>`,
  ];
  if (scores) {
    prologueParts.push(
      `<div class="nyan"><span class="say">가장 궁금하실 것부터 먼저 보여드릴게요.</span></div>`,
      gaugeCard("두 사람이 다시 만날 가능성", scores.reunion, reunionCaption(scores.reunion)),
      miniGaugesCard([
        { label: "그 사람의 재회 마음", score: scores.partnerMind },
        { label: "두 사람의 인연 궁합", score: scores.chemistry },
        { label: "다시 만난 뒤의 흐름", score: scores.afterReunion },
      ]),
    );
  }
  prologueParts.push(
    `<div class="nyan tail"><span class="say">이 숫자가 나온 이유, 지금부터 차근차근 풀어드릴게요.</span></div>`,
    `<div class="nyan"><span class="say">먼저 두 분의 사주를 표로 정리했어요.</span></div>`,
    myeongsikCardHtml ?? simpleMsCard(`${name}님의 사주`, birthLabel, myeongsik),
  );
  if (opts.partnerMsCardHtml) {
    prologueParts.push(opts.partnerMsCardHtml);
  } else if (opts.partnerMyeongsik) {
    const pTitle = opts.partnerName ? `${opts.partnerName}님의 사주` : "그 사람의 사주";
    prologueParts.push(simpleMsCard(pTitle, partnerLabel, opts.partnerMyeongsik));
  }
  if (question) {
    prologueParts.push(`<div class="card"><p class="card-desc" style="margin:0">${esc(question)}</p></div>`);
  }
  prologueParts.push(
    `<div class="nyan tail"><span class="say">준비되셨나요? 다음 장부터 두 분의 이야기를 시작할게요.</span></div>`,
  );
  views.push({
    label: "프롤로그.",
    title: "묘묘의 인사.",
    html: prologueParts.join(""),
    sub: true,
  });

  // ── 장별 뷰 — 장 앞에 위젯 삽입 ──
  const widgetFor = (title: string): string => {
    if (!scores) return "";
    if (title.startsWith("지금, 그 사람의 마음"))
      return gaugeCard("그 사람의 재회 마음", scores.partnerMind, scores.partnerMind >= 50 ? "작은 계기만 있으면 마음이 움직일 수 있어요." : "지금은 마음의 문이 살짝 닫혀 있어요.");
    if (title.startsWith("다시 이어지는 시기")) return calendarCard(scores.golden);
    if (title.startsWith("다시 만난다면"))
      return gaugeCard("다시 만난 뒤의 흐름", scores.afterReunion, scores.afterReunion >= 50 ? "서로 노력하면 예전보다 나은 사이가 될 수 있어요." : "같은 자리에서 다시 부딪히지 않도록 조심해야 해요.");
    if (title.startsWith("만약 놓아준다면"))
      return gaugeCard("새로운 인연의 가능성", scores.newLove, scores.newLove >= 60 ? "새 인연의 흐름이 밝게 열려 있어요." : "서두르지 않으면 좋은 흐름이 찾아와요.");
    return "";
  };

  sections.forEach((sec, i) => {
    const widget = widgetFor(sec.title);
    views.push({
      label: `${i + 1}장.`,
      title: dot(sec.title),
      html: widget + bodyHtml(sec.body),
      sub: true,
    });
  });

  return { type: "life-saju-v1", name, birthLabel, views };
}
