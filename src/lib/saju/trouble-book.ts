// =====================================================
// 고민 사주 결과지 → 인생 사주 뷰어(LifeBookViewer) 형식 변환
// =====================================================
// 기존 결과지 마크다운(## 섹션 13개)의 내용은 그대로 두고,
// 장(챕터) 단위 뷰 배열로만 재구성한다. 프롬프트/생성 로직과 무관.

import type { LifeReportPayload } from "@/lib/saju/life-report";
import type { Myeongsik } from "@/lib/saju/manseryeok";

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

/** **강조** → 핑크 하이라이트, 나머지는 이스케이프 */
function inline(s: string): string {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>');
}

/** 섹션 본문(문단 나열) → 뷰어 문단 html */
function bodyHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="para">${inline(p.replace(/\n/g, " "))}</p>`)
    .join("");
}

/** 명식표 카드 html (뷰어 .ms 표 스타일) */
function myeongsikCard(name: string, birthLabel: string, ms: Myeongsik): string {
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
<p class="card-title">${esc(name)}님의 사주</p>
<p class="card-sub">${esc(birthLabel)}</p>
<table class="tbl ms">
<tr><th class="corner"></th>${head}</tr>
<tr><th>天干<small>(천간)</small></th>${gan}</tr>
<tr><th>地支<small>(지지)</small></th>${ji}</tr>
</table>
</div>`;
}

export function buildTroubleBookPayload(opts: {
  name: string;
  birthLabel: string;
  question: string | null;
  myeongsik: Myeongsik;
  md: string;
  /** 인생 사주식 풀 명식표 카드 html — 있으면 간이 명식표 대신 사용 */
  myeongsikCardHtml?: string;
}): LifeReportPayload {
  const { name, birthLabel, question, myeongsik, md, myeongsikCardHtml } = opts;

  // '## ' 섹션 분리 (내용은 그대로)
  const sections: { title: string; body: string }[] = [];
  for (const part of md.split(/\n(?=## )/)) {
    const m = part.match(/^## (.+)\n?([\s\S]*)$/);
    if (m) sections.push({ title: m[1].trim(), body: m[2].trim() });
  }

  const views: LifeReportPayload["views"] = [];
  const no = (n: number) => String(n).padStart(2, "0");
  const dot = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`);

  // 01 — 나의 사주와 고민 (기존 헤더의 Q·명식표를 그대로 재배치)
  // label 은 목차 번호로만 쓰고, 본문에서는 "NN. 제목." 소제목으로 표시(sub)
  views.push({
    label: `${no(1)}.`,
    title: dot("나의 사주와 고민"),
    html: (() => {
      // 고민(Q)은 명식표 카드와 분리해 표 위에 "OO님의 고민" 카드로 둔다
      const qBlock = question
        ? `<div class="card"><p class="card-title">${esc(name)}님의 고민</p>` +
          `<p class="card-desc" style="margin:0">${esc(question)}</p></div>`
        : "";
      const card = myeongsikCardHtml ?? myeongsikCard(name, birthLabel, myeongsik);
      const cardWithQ = qBlock + card;
      return (
        // 인생 사주와 동일하게 말풍선 그룹의 첫 버블에만 꼬리를 단다
        `<div class="nyan tail"><span class="say">안녕하세요, ${esc(name)}님. 냥점의 점술사 묘묘예요. 이렇게 인연이 닿아 정말 기뻐요.</span></div>` +
        `<div class="nyan"><span class="say">보내주신 고민, 제가 찬찬히 들여다봤어요.</span></div>` +
        `<div class="nyan"><span class="say">먼저 보기 쉽게 표로 정리했어요.</span></div>` +
        cardWithQ +
        `<div class="nyan tail"><span class="say">이제 풀이 준비가 끝났어요.</span></div>` +
        `<div class="nyan"><span class="say">다음 장부터 ${esc(name)}님의 고민을 본격적으로 풀어드릴게요.</span></div>`
      );
    })(),
    sub: true,
  });

  sections.forEach((sec, i) => {
    views.push({
      label: `${no(i + 2)}.`,
      title: dot(sec.title),
      html: bodyHtml(sec.body),
      sub: true,
    });
  });

  return { type: "life-saju-v1", name, birthLabel, views };
}
