// =====================================================
// 커리어 사주 (career-saju) — 7장 커리어 리포트 생성 모듈
// =====================================================
// 인생 사주와 같은 챕터 뷰어(life-saju-v1 payload)를 쓰되, 내용은 커리어에만 집중한다.
// 텍스트 파트 + 구조화(JSON) 파트를 병렬 호출해 데이터 카드(강점 점수·직무 순위·회사·역전 기회)와
// 함께 views 배열로 조립한다. 결과는 saju_results.interpretation_md 에 JSON 문자열로 저장된다.

import { generateInterpretation } from "@/lib/saju/llm";
import type { SajuAnalysisResponse } from "@/lib/saju/saju-api";
import { buildBujeokHtml } from "@/lib/saju/trouble-book";
import {
  LIFE_PAYLOAD_TYPE,
  type LifeReportPayload,
  type LifeView,
  buildBaseCtx,
  buildCards,
  renderBody,
  nyan,
  addTails,
  seunCtx,
} from "@/lib/saju/life-report";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Api = any;

export const CAREER_SLUG = "career-saju";

export type CareerOpts = {
  name: string;
  birthDate: string;
  birthTime: string | null;
  timeUnknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
  /** MBTI 4글자 (선택) */
  mbti?: string;
  /** 현재 상황 — 취업 준비 중 / 재직 중 / 이직 준비 중 / 프리랜서·창업 고민 중 / 학생 */
  status?: string;
  /** 커리어 고민 한 줄 (선택) */
  concern?: string;
};

// ── 구조화 응답 타입 ─────────────────────────────────
type Strengths = { strengths: { name: string; score: number; why: string }[]; edge: string };
type JobsData = {
  jobs: { name: string; why: string }[];
  industries: { name: string; why: string; companies: string[] }[];
  avoid: { title: string; why: string };
};
type Gaeun = {
  outfit: { color: string; reason: string };
  desk: { direction: string; reason: string };
  items: { name: string; reason: string }[];
  mindset: string;
  anxiety: string;
  checklist: string[];
};
type Opps = { opportunities: { year: number; month: number; title: string; why: string }[] };

const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const para = (s: string) => renderBody(String(s ?? ""));

// ── 잡 정의 ──────────────────────────────────────────
type Job = { key: string; brief: string; chars: string; extraCtx?: string; json?: boolean };

function buildJobs(a: Api, name: string, currentYear: number, opts: CareerOpts): Job[] {
  const N = name;
  const jobs: Job[] = [];
  const push = (key: string, brief: string, chars: string, extraCtx?: string, json = false) =>
    jobs.push({ key, brief, chars, extraCtx, json });

  // 1장 — 강점 키워드
  push("ch1-traits", `1장 내 강점 키워드 분석 — 반드시 두 소제목만 이 순서로: '### 타고난 성향'(일간·일지·십성 근거로 일할 때 드러나는 성향을 장면으로. 겉모습과 속마음의 차이, 몰입하는 일과 질색하는 일, 만족하는 환경), '### 직장인 · CEO · 프리랜서, 내 운명은?'(결론부터 한 문장으로 못 박고 사주 근거 — 신강약·관성·비겁·식상 — 로 왜 그런지. 셋 중 가장 맞는 길과 차선의 길까지).`, "2,600~3,000");
  push("ch1-strength", `1장 — 자소서·면접에 써먹을 강점 TOP3 와 차별화된 경쟁력. JSON으로만 응답:
{"strengths":[{"name":"강점이름","score":점수,"why":"왜 이 강점이 있는지 사주 근거 포함 220~280자"},…3개],"edge":"남들과 차별화된 경쟁력 — 세 강점이 합쳐질 때 나오는 ${N}님만의 무기를 500~650자로"}
규칙: name 은 다음 중에서만 고른다 — 대인관계력, 실행력, 창의력, 분석력, 꼼꼼함, 리더십, 소통력, 끈기, 전문성, 적응력, 협상력, 기획력, 공감력, 추진력. score 는 55~95 정수, 1위가 가장 높고 셋이 서로 다르게. 모든 문장은 "~요" 체.`, "", undefined, true);
  push("ch1-weak", `1장 — 치명적인 내 약점. 반드시 두 소제목: '### 내 발목을 잡는 약점'(사주에서 과한 기운·부족한 기운이 일터에서 만드는 실수 패턴을 솔직하게, 구체 장면 2개), '### 약점도 강점으로 만들려면?'(같은 기운을 다르게 쓰는 법, 바로 해볼 행동 3가지를 문단 속에 녹여서). 성향 설명 반복 금지.`, "1,800~2,200");

  // 2장 — 직무·회사
  push("ch2-data", `2장 찰떡인 직무와 회사 — JSON으로만 응답:
{"jobs":[{"name":"직무명(예: 연구개발(R&D), 콘텐츠 마케팅, 데이터 분석)","why":"이 직무가 맞는 사주 근거와 일하는 장면 260~320자"},…3개(1위→3위)],
"industries":[{"name":"산업군(예: 금융 / 증권, IT / 플랫폼, 공공 / 행정)","why":"이 산업에 판이 열리는 이유 160~220자","companies":["회사1",…7개]},…3개(1위→3위)],
"avoid":{"title":"절대 지원하면 안 되는 곳 유형을 한 줄로","why":"기운이 안 맞는 이유와 그곳에서 겪게 될 일 380~450자"}}
규칙: companies 는 실제로 존재하고 널리 알려진 국내 기업·기관·공공기관 이름만(상장사·대기업·공기업·유명 스타트업). 확실하지 않은 이름은 넣지 않는다. 산업과 직무는 사주의 오행·십성·용신에 맞춘다${opts.status ? ` (현재 상황 '${opts.status}'을 고려)` : ""}. 모든 문장은 "~요" 체.`, "", undefined, true);
  push("ch2-intro", `2장 — ${N}님의 천직이 무엇일지 큰 그림. 반드시 두 소제목: '### 일에서 빛나는 조건'(어떤 환경·속도·역할에서 능력이 터지는지, 사주 근거), '### 지금 커리어 단계에서의 선택 기준'(${opts.status ? `현재 상황 '${opts.status}'에 맞춰` : "지금 단계에 맞춰"} 직무·회사를 고를 때 양보하면 안 되는 기준 3가지를 문단으로). 구체 직무명·회사명 나열은 금지(다른 파트에서 다룸).`, "1,600~2,000");

  // 3장 — 전략·개운
  push("ch3-strategy", `3장 실전 전략과 합격 개운법 — 반드시 두 소제목: '### 자소서 전략'(${N}님 강점을 어떤 순서·표현으로 써야 통하는지, 피해야 할 표현, 예시 문장 2개를 문단에 녹여), '### 면접 전략'(첫인상에서 살릴 기운, 압박 질문에 흔들리는 포인트와 대처, 마지막 한마디). ${opts.concern ? `고민 '${opts.concern}'에 직접 답하는 문단을 하나 넣는다.` : ""}`, "2,200~2,600");
  push("ch3-gaeun", `3장 — ${N}님만의 합격운 개운 가이드. JSON으로만 응답:
{"outfit":{"color":"용신 오행에 맞는 면접 의상 색(한 단어·두 단어)","reason":"왜 이 색인지 용신·희신 근거 150~200자"},
"desk":{"direction":"책상이 향할 방향(동/서/남/북 등)","reason":"근거 120~160자"},
"items":[{"name":"합격운 올려줄 아이템","reason":"80~120자"},…3개],
"mindset":"합격 전 가져야 할 마인드셋 — 500~650자",
"anxiety":"불안할 때 이렇게 하세요 — 400~500자",
"checklist":["최종 체크리스트 항목(한 문장)",…6개]}
모든 문장은 "~요" 체.`, "", undefined, true);

  // 4장 — 귀인
  push("ch4-guiin", `4장 앞길을 밝혀줄 귀인 — 반드시 이 순서의 소제목: '### 나를 도와줄 귀인은 누구일까?'(귀인·십성·합 근거로 어떤 성향·위치의 사람인지 — 상사/동료/선배/거래처 등 구체적으로), '### 어떻게 만날까?'(자리·모임·시기), '### 눈에 띄는 법', '### 관계를 굳히는 법', '### 업무 시너지가 폭발할 시기'(대운·세운 근거로 연도까지). 귀인이 없는 사주면 그 뜻을 따뜻하게 풀고 대신 만들어 가는 법을.`, "2,600~3,000");

  // 5장 — 빌런
  push("ch5-villain", `5장 나를 방해할 빌런 — 반드시 이 순서의 소제목: '### 커리어를 방해하는 빌런은?'(충·신살·기신 근거로 어떤 유형의 사람인지, 실제 일터 장면), '### 어떻게 만날까?', '### 갈등이 폭발할 시기'(세운 근거로 연도), '### 빌런 퇴치법'(피하는 법·버티는 법·역이용하는 법). 겁주지 않고 대비하는 톤.`, "2,200~2,600");

  // 6장 — 로드맵·역전 기회
  const years3 = [currentYear, currentYear + 1, currentYear + 2];
  const seun3 = years3.map((y) => seunCtx(a, y)).join("\n");
  push("ch6-opps", `6장 — 앞으로 3년(${years3[0]}~${years3[2]}년) 커리어 역전 기회. JSON으로만 응답:
{"opportunities":[{"year":연도,"month":월(1~12),"title":"기회 한 줄(12자 이내, 예: 이직 제안이 오는 달)","why":"왜 이 시기인지 세운·월 기운 근거 110~150자"},…6~9개]}
규칙: 지금은 ${currentYear}년 ${new Date().getMonth() + 1}월이므로 그 다음 달부터 ${years3[2]}년 12월 사이의 달만(이미 지난 달 금지), 같은 달 중복 없이, 시간순 정렬. 세운 자료에 근거하되 월은 그 해 기운이 ${N}님 용신·희신과 만나는 달로 고른다. 모든 문장은 "~요" 체.`, "", seun3, true);
  push("ch6-now", `6장 30년 커리어 로드맵 — 반드시 두 소제목: '### 나의 현재 커리어운'(현재 대운·올해 세운 근거로 지금 ${N}님이 어느 구간에 있는지, ${opts.status ? `'${opts.status}' 상황에서` : ""} 지금 해야 할 것과 하면 안 되는 것), '### 앞으로 3년, 커리어 전환 시기'(${years3[0]}~${years3[2]}년을 해마다 — 움직일 해와 다질 해를 구분해 구체적으로). ${opts.concern ? `고민 '${opts.concern}'에 대한 시기 답을 포함한다.` : ""}`, "2,200~2,600", seun3);
  push("ch6-road", `6장 — 향후 30년 직업운의 흐름. 반드시 이 순서의 소제목: '### 10년 뒤', '### 20년 뒤', '### 30년 뒤'(각 시기의 대운 근거로 커리어의 모양·위치·수입 흐름을 장면으로), '### 무조건 조심해야 할 시기'(대운·세운 근거로 연도 구간), '### 어려운 시기 극복하는 방법'. 현재 커리어운 반복 금지.`, "2,800~3,200");

  // 7장 — 마지막 편지
  push("closing", `7장 묘묘의 마지막 편지 — 리포트 전체를 닫는 따뜻한 편지. ${N}님의 가장 큰 강점 하나를 다시 짚어 주고, 커리어 길에서 지킬 당부 3가지를 문단 속에 녹여서. 새로운 풀이 추가 금지. 소제목 없이 문단만.`, "1,000~1,300");

  return jobs;
}

// ── 병렬 LLM 실행 ───────────────────────────────────
function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s < 0 || e <= s) throw new Error("JSON 블록 없음");
  return JSON.parse(cleaned.slice(s, e + 1)) as T;
}

async function runJobs(jobs: Job[], baseCtx: string, name: string): Promise<{ results: Record<string, string>; provider: string; model: string }> {
  const SYSTEM = `당신은 사주로 커리어를 상담해 주는 냥점의 점술사 묘묘입니다. 전문 용어(천간·지지·십성·대운 등)를 쓸 때는 반드시 쉬운 말로 풀어 설명합니다. 말투는 반드시 "~요" 체. 내담자를 "${name}님"으로 호칭하세요. 모든 해석에 사주 근거를 일상어로 녹여 쓰고, 핵심 문장은 장 전체에서 2개만 **문장** 형태로 강조하세요. 소제목이 필요하면 "### 소제목" 형식만 사용하고, 목록은 쓰지 마세요. 실제 직장·취업·이직 장면(면접, 회의, 상사, 동료, 연봉 협상)을 구체적으로 넣어 이야기처럼 서술하세요.`;
  const SYSTEM_JSON = `당신은 사주로 커리어를 상담해 주는 냥점의 점술사 묘묘입니다. 요청된 JSON 형식으로만 응답하고, JSON 바깥에 어떤 설명·코드펜스도 붙이지 마세요. 문자열 값 안의 문장은 "~요" 체로, 내담자를 "${name}님"으로 호칭하고, 사주 근거를 쉬운 말로 녹여 씁니다.`;

  let provider = "";
  let model = "";
  const one = async (job: Job): Promise<[string, string]> => {
    const user = job.json
      ? `${baseCtx}\n${job.extraCtx ?? ""}\n\n---\n${job.brief}`
      : `${baseCtx}\n${job.extraCtx ?? ""}\n\n---\n이번에 쓸 내용: ${job.brief}\n\n요구사항:\n- ${job.chars}자 분량\n- 문단 위주 서술, 목록 금지, 소제목은 지시된 경우만 "### " 사용\n- 사주 근거를 일상어로 최소 4회 녹일 것\n- **강조**는 전체에서 2개만`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await generateInterpretation({ system: job.json ? SYSTEM_JSON : SYSTEM, user });
        provider = res.provider;
        model = res.model;
        if (!res.text.trim()) throw new Error("빈 응답");
        if (job.json) parseJson(res.text); // 형식 검증 — 실패 시 재시도
        return [job.key, res.text];
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    throw new Error(`[career-report] ${job.key} 생성 실패: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
  };

  const entries = await Promise.all(jobs.map(one));
  return { results: Object.fromEntries(entries), provider, model };
}

// ── 카드 조립 ───────────────────────────────────────
function strengthCard(d: Strengths): string {
  const rows = d.strengths
    .slice(0, 3)
    .map(
      (s) => `<div class="ring-item"><div class="gauge-ring sm" style="--p:${Math.max(0, Math.min(100, Math.round(s.score)))}"><b>${Math.round(s.score)}점</b></div><p>${esc(s.name)}</p></div>`,
    )
    .join("");
  return `<section class="card"><h4 class="sub-h kr-h">자소서·면접 때 써먹어야 할 강점 TOP3</h4><div class="ring-row" style="margin-top:16px">${rows}</div></section>`;
}
function rankList(items: { name: string; why?: string }[]): string {
  return `<div class="rank-list">${items
    .map((it, i) => `<div class="rank-item"><span class="rank-no">${i + 1}</span><div class="rank-body"><b>${esc(it.name)}</b>${it.why ? `<span>${esc(it.why)}</span>` : ""}</div></div>`)
    .join("")}</div>`;
}
function companiesCard(ind: JobsData["industries"]): string {
  const blocks = ind
    .slice(0, 3)
    .map(
      (x, i) =>
        `<div class="co-head"><span class="rank-no">${i + 1}</span>${esc(x.name)}</div><div class="co-grid">${(x.companies ?? []).slice(0, 7).map((c) => `<span>${esc(c)}</span>`).join("")}</div>`,
    )
    .join("");
  return `<section class="card"><h4 class="sub-h">나와 딱 맞는 회사</h4><p class="sub-note">산업군 순위별로 기운이 잘 맞는 대표 회사들이에요. 비슷한 결의 다른 회사도 좋아요.</p><div class="co-wrap">${blocks}</div></section>`;
}
function gaeunCard(g: Gaeun): string {
  const items = (g.items ?? []).slice(0, 3).map((it) => `<div class="rank-item"><span class="rank-no">★</span><div class="rank-body"><b>${esc(it.name)}</b><span>${esc(it.reason)}</span></div></div>`).join("");
  return (
    `<section class="card"><h4 class="sub-h kr-h">합격운 개운 가이드</h4>` +
    `<div class="rank-list">` +
    `<div class="rank-item"><span class="rank-no">衣</span><div class="rank-body"><b>'내 합격 용신' 면접 의상 — ${esc(g.outfit?.color ?? "")}</b><span>${esc(g.outfit?.reason ?? "")}</span></div></div>` +
    `<div class="rank-item"><span class="rank-no">方</span><div class="rank-body"><b>책상 방향 — ${esc(g.desk?.direction ?? "")}</b><span>${esc(g.desk?.reason ?? "")}</span></div></div>` +
    items +
    `</div></section>`
  );
}
function checklistCard(list: string[]): string {
  return `<section class="card"><h4 class="sub-h">최종 체크리스트</h4><ul class="dolist do">${(list ?? []).slice(0, 8).map((l) => `<li>${esc(l)}</li>`).join("")}</ul></section>`;
}
function oppsCard(o: Opps, name: string): string {
  const list = [...(o.opportunities ?? [])].sort((x, y) => x.year - y.year || x.month - y.month);
  const chips = list.map((x) => `<span>${x.year}년 ${x.month}월</span>`).join("");
  const rows = list.map((x, i) => `<div class="rank-item"><span class="rank-no">${i + 1}</span><div class="rank-body"><b>${x.year}년 ${x.month}월 · ${esc(x.title)}</b><span>${esc(x.why)}</span></div></div>`).join("");
  return (
    `<section class="card"><h4 class="sub-h kr-h">절대 놓치면 안 될 커리어 역전 기회</h4>` +
    `<p class="sub-note">앞으로 3년, ${name}님의 기운이 크게 열리는 달이에요.</p>` +
    `<div class="big-num">${list.length}<small>회</small></div>` +
    `<div class="mon-chips">${chips}</div>` +
    `<div class="rank-list" style="margin-top:14px">${rows}</div></section>`
  );
}

// ── 뷰 조립 ─────────────────────────────────────────
function assembleViews(a: Api, name: string, birthLabel: string, parts: Record<string, string>, opts: CareerOpts): LifeView[] {
  const cards = buildCards(a, name, birthLabel, []) as any;
  const R = (key: string) => renderBody(parts[key] ?? "");
  const J = <T,>(key: string): T => parseJson<T>(parts[key] ?? "{}");
  const views: LifeView[] = [];
  const ch = (label: string, title: string, blocks: string[]) => views.push({ label, title, html: blocks.join("") });

  const strengths = J<Strengths>("ch1-strength");
  const jobsData = J<JobsData>("ch2-data");
  const gaeun = J<Gaeun>("ch3-gaeun");
  const opps = J<Opps>("ch6-opps");

  const profileBits = [opts.mbti ? `MBTI ${opts.mbti}` : "", opts.status ?? ""].filter(Boolean).join(" · ");

  ch("1장", "프롤로그 Prologue", [
    nyan(`안녕하세요, ${name}님. 냥점의 점술사 묘묘예요.`),
    nyan(`모든 답은 이미 ${name}님 안에 있어요. 오늘은 그 답을 커리어라는 렌즈로 꺼내 볼게요.`),
    nyan(`먼저 ${name}님이 어떤 분인지부터 살짝 보여드릴게요.`),
    cards.myeongsikCard,
    nyan(`${name}님의 생년월일시에 해당하는 하늘과 땅의 글자를 십성, 십이운성, 신살, 귀인과 함께 적은 표예요.`),
    cards.ohengCardFull,
    cards.singangCard,
    profileBits ? nyan(`${name}님이 알려주신 정보(${profileBits})도 함께 참고해서 풀어 드릴게요.`) : "",
    opts.concern ? nyan(`그리고 "${esc(opts.concern)}" — 이 고민에는 3장과 6장에서 콕 집어 답해 드릴게요.`) : "",
    nyan("자, 그럼 1장부터 시작할게요."),
  ]);

  ch("2장", "내 강점 키워드 분석", [
    nyan(`나는 어떤 사람일까? ${name}님이 일터에서 어떤 사람인지부터 볼게요.`),
    R("ch1-traits"),
    nyan("이번엔 자소서와 면접에서 바로 써먹을 강점이에요."),
    strengthCard(strengths),
    rankList(strengths.strengths.slice(0, 3).map((s) => ({ name: `${s.name} (${Math.round(s.score)}점)`, why: s.why }))),
    `<h3 class="sub-h">남들과 차별화된 경쟁력</h3>` + para(strengths.edge),
    nyan("강점만 보면 반쪽이죠. 이번엔 솔직하게 약점이에요."),
    R("ch1-weak"),
    nyan(`여기까지 오니 ${name}님이라는 분이 제법 또렷하게 보이는데요? 다음 장은 천직 이야기예요.`),
  ]);

  ch("3장", "찰떡인 직무와 회사", [
    nyan(`자 그럼, ${name}님의 천직이 무엇일지 볼게요.`),
    R("ch2-intro"),
    `<section class="card"><h4 class="sub-h kr-h">내게 딱 맞는 직무 TOP3</h4>${rankList(jobsData.jobs.slice(0, 3))}</section>`,
    nyan("직무를 봤으니, 이번엔 판이 열리는 산업과 회사예요."),
    `<section class="card"><h4 class="sub-h">판이 열리는 산업</h4>${rankList(jobsData.industries.slice(0, 3).map((x) => ({ name: x.name, why: x.why })))}</section>`,
    companiesCard(jobsData.industries),
    nyan("반대로, 기운이 안 맞는 곳도 있어요."),
    `<h3 class="sub-h">절대 지원하면 안 되는 곳</h3><p class="para"><strong class="hl">${esc(jobsData.avoid?.title ?? "")}</strong></p>` + para(jobsData.avoid?.why ?? ""),
    nyan("다음 장에서는 실제로 붙는 전략을 알려드릴게요."),
  ]);

  ch("4장", "실전 전략과 합격 개운법", [
    nyan(`${name}님이 실제로 합격하는 전략이에요.`),
    R("ch3-strategy"),
    nyan(`${name}님만의 합격운 올리는 법도 챙겨 드릴게요.`),
    gaeunCard(gaeun),
    `<h3 class="sub-h">합격 전 가져야 할 마인드셋</h3>` + para(gaeun.mindset),
    `<h3 class="sub-h">불안하다면 이렇게 하세요</h3>` + para(gaeun.anxiety),
    checklistCard(gaeun.checklist),
    nyan(`${name}님 앞에 과연 어떤 커리어 길이 펼쳐질지, 다음 장에서는 도와줄 사람부터 볼게요.`),
  ]);

  ch("5장", "앞길을 밝혀줄 귀인", [
    nyan(`그렇다면 ${name}님 앞길을 환히 틔어 줄 귀인은 누구일까요?`),
    cards.msFocusCard("귀인"),
    R("ch4-guiin"),
    nyan(`그런데 ${name}님의 앞길을 막을 빌런 한 명이 보이네요.`),
  ]);

  ch("6장", "나를 방해할 빌런", [
    nyan("뒤에서 남몰래 발목을 잡을 빌런 이야기예요. 겁먹지 말고 대비만 하면 돼요."),
    cards.msFocusCard("신살"),
    R("ch5-villain"),
    nyan(`${name}님 앞에 펼쳐질 여정에는 무한한 가능성이 있어요. 이제 로드맵을 볼게요.`),
  ]);

  ch("7장", "30년 커리어 로드맵과 다가올 역전 기회", [
    nyan("그래도 괜찮아요. 절대 놓치면 안 될 기회가 이렇게나 많거든요."),
    oppsCard(opps, name),
    R("ch6-now"),
    nyan("이제 더 멀리, 30년을 볼게요."),
    cards.daeunCard,
    R("ch6-road"),
    nyan(`와아 ${name}님, 여기까지 오시느라 고생 많았어요. 이제부터는 ${name}님이 써 내려갈 차례예요.`),
  ]);

  ch("8장", "묘묘의 마지막 편지", [R("closing")]);

  const bujeokHtml = buildBujeokHtml(
    name,
    a.gyeokguk?.yongsin?.오행,
    { day: { cheongan: a.ganji?.day?.gan } } as Parameters<typeof buildBujeokHtml>[2],
  );
  if (bujeokHtml) views.push({ label: "9장", title: "보너스 Bonus — 행운 부적", html: bujeokHtml });

  return views.map((v) => ({ ...v, html: addTails(v.html) }));
}

// ── 진입점 ──────────────────────────────────────────
export async function generateCareerReport(
  analysis: SajuAnalysisResponse,
  opts: CareerOpts,
): Promise<{ payload: LifeReportPayload; provider: string; model: string }> {
  const a = analysis as Api;
  if (!a?.ganji?.day) throw new Error("커리어 사주 생성에는 만세력 풀 분석(ganji)이 필요합니다");

  const name = opts.name?.trim() || "고객";
  const [y, m, d] = opts.birthDate.split("-").map((x) => parseInt(x, 10));
  const timePart = !opts.timeUnknown && opts.birthTime ? ` ${opts.birthTime.slice(0, 5)}` : "";
  const birthLabel = `${y}년 ${m}월 ${d}일${timePart} (${opts.calendar === "lunar" ? "음력" : "양력"}) · ${opts.gender === "male" ? "남성" : "여성"}`;
  const currentYear = Number(a.seun?.currentSeun?.year ?? new Date().getFullYear());

  const extra: string[] = [];
  if (opts.mbti) extra.push(`[MBTI] ${opts.mbti} — 성향 풀이에서 사주와 맞닿는 지점을 한 번만 언급(MBTI에 기대지 말 것).`);
  if (opts.status) extra.push(`[현재 상황] ${opts.status} — 전략·시기 조언을 이 상황에 맞춘다.`);
  if (opts.concern) extra.push(`[커리어 고민] ${opts.concern} — 전략 장과 시기 장에서 이 고민에 직접 답한다.`);
  const baseCtx = `${buildBaseCtx(a, name)}\n${extra.join("\n")}`;

  const jobs = buildJobs(a, name, currentYear, opts);
  const { results, provider, model } = await runJobs(jobs, baseCtx, name);
  const views = assembleViews(a, name, birthLabel, results, opts);

  return { payload: { type: LIFE_PAYLOAD_TYPE, name, birthLabel, views }, provider, model };
}

/** saju_inputs.concerns 태그에서 커리어 입력값 추출 */
export function parseCareerConcerns(concerns: string[]): { mbti?: string; status?: string; concern?: string } {
  let mbti: string | undefined;
  let status: string | undefined;
  const rest: string[] = [];
  for (const c of concerns) {
    if (c.startsWith("[MBTI]")) mbti = c.replace("[MBTI]", "").trim() || undefined;
    else if (c.startsWith("[상황]")) status = c.replace("[상황]", "").trim() || undefined;
    else if (!c.startsWith("[")) rest.push(c.trim());
  }
  return { mbti, status, concern: rest.filter(Boolean)[0] };
}
