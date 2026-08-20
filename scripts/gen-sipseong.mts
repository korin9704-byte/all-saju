// 일주 분석 파트 재생성 (참고 리포트 구성: 내 사주의 특징 / 생활방식 / 행동성향 / 내면성향)
// 실행: pnpm tsx scripts/gen-sipseong.mts <full-response.json> <출력.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outPath] = process.argv;
if (!inputPath || !outPath) { console.error("usage: gen-sipseong.mts <full.json> <out.html>"); process.exit(1); }

const envRaw = readFileSync(".env.local", "utf-8");
const env = (n: string) => envRaw.match(new RegExp(`^${n}=(.*)$`, "m"))?.[1]?.trim();
const OPENAI_KEY = env("OPENAI_API_KEY")!;
const MODEL = env("LLM_MODEL") ?? "gpt-5.4-mini";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;
const data: Api = JSON.parse(readFileSync(inputPath, "utf-8"));
const g = data.ganji;
const PERSON = { name: "영희" };

const baseCtx = [
  `[사주 원국] 년주 ${g.year.gan}${g.year.ji} / 월주 ${g.month.gan}${g.month.ji} / 일주 ${g.day.gan}${g.day.ji} / 시주 ${g.hour.gan}${g.hour.ji}`,
  `[일간] ${g.day.gan} (${g.day.ohaeng.gan}행, ${g.day.eumyang.gan})`,
  `[십성] ${data.sipseong.sipseongs.map((s: Api) => `${s.position} ${s.sipseong}`).join(", ")} (비겁${data.sipseong.summary.bigyeop} 식상${data.sipseong.summary.siksang} 재성${data.sipseong.summary.jaeseong} 관성${data.sipseong.summary.gwanseong} 인성${data.sipseong.summary.inseong})`,
  `[신강약] ${data.sinStrength.strength}(${data.sinStrength.score}점) 득령${data.sinStrength.deukryeong ? "O" : "X"} 득지${data.sinStrength.deukji ? "O" : "X"} 득세${data.sinStrength.deukse ? "O" : "X"}`,
  `[격국·용신] ${data.gyeokguk.name}, 용신 ${data.gyeokguk.yongsin?.오행}(${data.gyeokguk.yongsin?.십신}), 희신 ${data.gyeokguk.희신오행}, 기신 ${data.gyeokguk.기신오행}`,
  `[12운성] ${data.twelveFortune.fortunes.map((f: Api) => `${f.position} ${f.fortune}`).join(", ")}`,
  `[신살] ${data.sibisinsals.sibisinsals.map((s: Api) => `${s.name}(${s.position} ${s.ji})`).join(", ")}`,
].join("\n");

const SYSTEM = `당신은 사주를 쉽고 친근하게 풀어주는 냥점의 점술사입니다. 전문 용어(천간·지지·십성·대운 등)를 쓸 때는 반드시 쉬운 말로 풀어 설명합니다. 말투는 반드시 "~요" 체. 내담자를 "${PERSON.name}님"으로 호칭하세요. 모든 해석에 사주 근거를 일상어로 녹여 쓰고, 핵심 문장은 전체에서 2개만 **문장** 형태로 강조하세요. 소제목은 "### 소제목" 형식만 사용하고, 목록은 쓰지 마세요. 구체적인 생활 장면(직장·관계·돈 상황 예시)을 넣어 이야기처럼 서술하세요.`;

const brief1 = `십성 분석 기본 — ${PERSON.name}님 사주의 십성 구성(비겁 다수·관성·인성 중심, 재성 부재)을 중심으로 한 분석. 반드시 아래 세 소제목을 이 순서로 사용:
### 나의 십성은? — 사주에 자리 잡은 주요 십성들이 조화롭게 만드는 심리 구조와 삶의 지향(명예·실리·전문성 등)을 총평. 사주 초반부/후반부(년월 vs 일시)의 기운 변화 흐름도 언급.
### 내가 맺는 사회적 관계 — 직장·조직에서의 평판, 윗사람·동료와의 관계 역학, 갈등이 생기는 지점과 그때의 마음가짐을 구체적 장면으로. 나이 들수록 변하는 사회적 위치까지.
### 나와 가족들의 관계 (육친) — 부모(특히 어머니)의 영향, 가정 내 역학, 배우자 자리(일지)로 보는 배우자·자녀와의 관계, 가족 부양 책임감과 내면의 고독까지.
각 소제목 아래 800~950자, 전체 2,500~2,900자.`;

const brief2 = `시기별 십성 분석 — 십성의 배치(년주→시주 흐름)로 보는 인생 시기별 성향. 반드시 아래 네 소제목을 이 순서로 사용:
### 초년기 — 어린 시절의 기질과 가정·학교에서의 모습. 년주 기운 근거.
### 청년기 — 현재 30대 중반이 지나는 시기. 월주 기운 근거로 사회적 기반 마련, 갈등과 의구심, 대처법까지 가장 깊게.
### 중년기 — 일주 기운 근거로 전문성이 꽃피는 시기, 가족과의 관계 변화, 재물 흐름.
### 말년기 — 시주 기운 근거로 노후의 모습, 독립심과 사람들, 건강 관리 당부.
각 소제목 아래 750~900자, 전체 3,000~3,400자. 기본 분석 파트와 중복 금지.`;

async function gen(brief: string): Promise<string> {
  const user = `${baseCtx}\n\n---\n이번에 쓸 내용: ${brief}\n\n요구사항:\n- 문단 위주 서술, 목록 금지, 소제목은 "### " 형식만\n- 사주 근거를 일상어로 최소 4회 녹일 것\n- **강조**는 전체에서 2개만`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: MODEL, temperature: 0.7, max_completion_tokens: 6000,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }] }),
    });
    if (res.ok) {
      const json: Api = await res.json();
      return json.choices[0]?.message?.content ?? "";
    }
    if (res.status < 500 && res.status !== 429) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
  }
  throw new Error("OpenAI 재시도 초과");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const em = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong class="hl">$1</strong>');
function renderBody(text: string): string {
  return text.split(/\n+/).filter((p) => p.trim()).map((p) => {
    const m = p.match(/^###\s*(.+)$/);
    return m ? `<h3 class="sub-h">${esc(m[1])}</h3>` : `<p class="para">${em(p)}</p>`;
  }).join("");
}

const [t1, t2] = await Promise.all([gen(brief1), gen(brief2)]);
console.error(`생성 완료 — 기본 ${t1.length}자 / 시기별 ${t2.length}자`);
writeFileSync(outPath, renderBody(t1) + renderBody(t2), "utf-8");
console.error(`저장: ${outPath}`);
