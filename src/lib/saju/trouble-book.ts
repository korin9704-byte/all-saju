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

/** **강조** → 핑크 하이라이트, ISO 날짜 → 한국어 표기, 나머지는 이스케이프 */
function inline(s: string): string {
  return esc(s)
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y, m, d) => `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>');
}

/** 섹션 본문(문단·불릿 나열) → 뷰어 html — "- " 줄은 불릿(.dolist)으로.
 *  '해야 할 것' 문맥의 불릿은 ○, '하지 말아야 할 것' 문맥은 ✕ */
function bodyHtml(text: string): string {
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let mode: "do" | "dont" | null = null;
  const flushPara = () => {
    if (para.length) out.push(`<p class="para">${inline(para.join(" "))}</p>`);
    para = [];
  };
  // '해도 돼요/해야 할 것' 계열 = ○, '하면 안 돼요/하지 말' 계열 = ✕
  const DO_RE = /해도\s*(돼요|됩니다|되는|좋아요)|해야\s*할\s*것|해\s*보세요/;
  const DONT_RE = /하면\s*안\s*돼|하지\s*마|하지\s*말|피하(는|세요)/;
  const flushList = () => {
    if (list.length) {
      // 항목들 자체의 표현으로 다수결 판정, 비기면 직전 문단 문맥(mode)으로
      let doCnt = 0;
      let dontCnt = 0;
      for (const l of list) {
        if (DONT_RE.test(l)) dontCnt++;
        else if (DO_RE.test(l)) doCnt++;
      }
      const isDo = doCnt !== dontCnt ? doCnt > dontCnt : mode === "do";
      out.push(`<ul class="dolist${isDo ? " do" : ""}">${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
    }
    list = [];
  };
  for (const raw of text.split(/\n{2,}/)) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("- ")) {
        flushPara();
        list.push(line.slice(2));
      } else {
        flushList();
        if (/하지\s*말|피하는\s*게\s*좋아/.test(line)) mode = "dont";
        else if (/해야\s*할\s*것|해\s*보세요/.test(line)) mode = "do";
        para.push(line);
      }
    }
    flushPara();
    flushList();
  }
  return out.join("");
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
<h4 class="sub-h">사주팔자 — 타고난 여덟 글자</h4>
<p class="sub-note">${esc(name)} · ${esc(birthLabel)}</p>
<table class="tbl ms">
<tr><th class="corner"></th>${head}</tr>
<tr><th>天干<small>(천간)</small></th>${gan}</tr>
<tr><th>地支<small>(지지)</small></th>${ji}</tr>
</table>
</div>`;
}

// ── 행운 부적 (용신 오행 매칭 — 사주에 가장 필요한 기운) ──────────────────────────
const OHENG_META: Record<string, { key: string; kr: string; hanja: string; desc: string }> = {
  목: { key: "wood",  kr: "목", hanja: "木", desc: "쭉쭉 뻗는 나무의 기운이 막힌 일을 풀고 성장을 도와줄 거예요." },
  화: { key: "fire",  kr: "화", hanja: "火", desc: "타오르는 태양의 기운이 주변을 밝히고 좋은 인연을 끌어당겨 줄 거예요." },
  토: { key: "earth", kr: "토", hanja: "土", desc: "든든한 산의 기운이 흔들리지 않는 안정과 결실을 가져다줄 거예요." },
  금: { key: "metal", kr: "금", hanja: "金", desc: "맑게 울리는 종의 기운이 재물과 귀인을 불러줄 거예요." },
  수: { key: "water", kr: "수", hanja: "水", desc: "달빛 어린 물결의 기운이 지혜롭게 흘러 뜻을 이루게 해줄 거예요." },
};

// 일간 천간 → 오행 (용신을 모를 때 폴백)
const OHENG_BY_GAN: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

/** 결과지 마지막 장 — 용신(사주에 가장 필요한 기운) 오행에 맞는 행운 부적.
 *  용신을 모르면 일간 오행으로 폴백, 그것도 없으면 null */
export function buildBujeokHtml(name: string, yongsinOheng?: string | null, ms?: Myeongsik): string | null {
  const oheng = (yongsinOheng && OHENG_META[yongsinOheng] ? yongsinOheng : undefined)
    ?? (ms?.day?.cheongan ? OHENG_BY_GAN[ms.day.cheongan] : undefined);
  const el = oheng ? OHENG_META[oheng] : undefined;
  if (!el) return null;
  // 버튼 색 — 각 오행 부적 그림의 팔레트에 맞춤 (테두리·글씨)
  const BTN_COLORS: Record<string, { bd: string; fg: string }> = {
    wood: { bd: "#8FB57E", fg: "#4C7A4A" },
    fire: { bd: "#E89A6E", fg: "#C25B33" },
    earth: { bd: "#CfAA64", fg: "#8A6530" },
    metal: { bd: "#ABA6C0", fg: "#6E6A80" },
    water: { bd: "#85B3DA", fg: "#4A7FB0" },
  };
  const c = BTN_COLORS[el.key] ?? { bd: "#C95FC0", fg: "#A3327F" };
  return (
    `<div class="nyan tail"><span class="say">마지막 장까지 와주셨네요. ${esc(name)}님의 사주에 지금 가장 필요한 기운은 <b>${el.kr}(${el.hanja})</b>이에요. ${el.desc}</span></div>` +
    `<div class="nyan"><span class="say">그 기운을 가득 담아 ${esc(name)}님만을 위한 행운 부적을 준비했어요. 핸드폰 배경화면으로 간직하면, 묘묘가 곁에서 좋은 기운을 지켜드릴게요.</span></div>` +
    `<div class="bujeok-stage" data-key="${el.key}">` +
    `<div class="bujeok-wrap">` +
    `<img class="bujeok-img" src="/images/bujeok/${el.key}.webp" alt="행운 부적" />` +
    `<a class="bujeok-btn" style="border-color:${c.bd};color:${c.fg}" href="/images/bujeok/${el.key}-hd.jpg" download="냥점_행운부적_${esc(name)}.jpg">내 부적 저장하기!!</a>` +
    `</div></div>`
  );
}

export function buildTroubleBookPayload(opts: {
  name: string;
  birthLabel: string;
  question: string | null;
  myeongsik: Myeongsik;
  md: string;
  /** 인생 사주식 풀 명식표 카드 html — 있으면 간이 명식표 대신 사용 */
  myeongsikCardHtml?: string;
  /** 상대방 풀 명식표 html — 재회 추가 질문처럼 두 사람 사주를 함께 보여줄 때 */
  partnerMsCardHtml?: string;
  /** 1장에서 쓰는 표현 — 기본 "고민", 추가 질문 결과지는 "질문" */
  concernWord?: string;
  /** 용신 오행(목·화·토·금·수) — 행운 부적 매칭용. 없으면 일간 오행 폴백 */
  bujeokOheng?: string;
}): LifeReportPayload {
  const { name, birthLabel, question, myeongsik, md, myeongsikCardHtml, partnerMsCardHtml, concernWord = "고민", bujeokOheng } = opts;

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
    title: "프롤로그 Prologue",
    html: (() => {
      // 고민(Q)은 명식표 카드 아래에 별도 카드로 둔다 (카드 제목: "OO님의 사주와 고민")
      const qBlock = question
        ? `<div class="card"><p class="card-desc" style="margin:0">${esc(question)}</p></div>`
        : "";
      // 명식표 카드 — 빌더가 "이름 · 생년월일시 (양력) · 성별" 한 줄 헤더로 생성
      let card = myeongsikCardHtml ?? myeongsikCard(name, birthLabel, myeongsik);
      // 상대방 표가 함께 오면 재회 결과지처럼 (본인)/(상대방) 라벨을 붙인다
      if (partnerMsCardHtml) {
        card =
          card.replace('<h4 class="sub-h">', '<p class="ms-tag">(본인)</p><h4 class="sub-h">') +
          partnerMsCardHtml.replace('<h4 class="sub-h">', '<p class="ms-tag">(상대방)</p><h4 class="sub-h">');
      }
      const cardWithQ = card + qBlock;
      return (
        // 묘묘 아바타 + 채팅 버블 (이름표 없음)
        `<div class="moyo-chat"><span class="mav"></span><div class="mcol">` +
        `<span class="msay">안녕하세요, ${esc(name)}님. 냥점의 점술사 묘묘예요. 이렇게 인연이 닿아 정말 기뻐요.</span>` +
        `<span class="msay">보내주신 ${concernWord}, 제가 찬찬히 들여다봤어요.</span>` +
        `<span class="msay">먼저 보기 쉽게 표로 정리했어요.</span>` +
        `</div></div>` +
        cardWithQ +
        `<div class="moyo-chat"><span class="mav"></span><div class="mcol">` +
        `<span class="msay">이제 풀이 준비가 끝났어요.</span>` +
        `<span class="msay">다음 장부터 ${esc(name)}님의 ${concernWord}을 본격적으로 풀어드릴게요.</span>` +
        `</div></div>`
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

  // 마지막 장 — 일간 오행 행운 부적
  const bujeokHtml = buildBujeokHtml(name, bujeokOheng, myeongsik);
  if (bujeokHtml) {
    views.push({
      label: `${no(sections.length + 2)}.`,
      title: "보너스 Bonus — 행운 부적",
      html: bujeokHtml,
      sub: true,
    });
  }

  return { type: "life-saju-v1", name, birthLabel, views };
}
