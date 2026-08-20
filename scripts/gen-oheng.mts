// 일주 분석 파트 재생성 (참고 리포트 구성: 내 사주의 특징 / 생활방식 / 행동성향 / 내면성향)
// 실행: pnpm tsx scripts/gen-oheng.mts <full-response.json> <출력.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outPath] = process.argv;
if (!inputPath || !outPath) { console.error("usage: gen-oheng.mts <full.json> <out.html>"); process.exit(1); }

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

const brief = `오행 분석 — ${PERSON.name}님 사주의 오행 구성(금 발달, 화 적정, 토 적정, 목·수 부족)과 용신 金·희신 土·기신 火를 중심으로 한 분석. 반드시 아래 네 소제목을 이 순서로 사용:
### 오행으로 본 내 모습은? — 사주의 중심을 이루는 기운(강한 금과 그것을 달구는 화)을 자연물 형상에 비유해 전체 그림을 그리고, 그 조합이 만드는 기질과 에너지를 서술.
### 용신 — 용신 金이 이 사주에서 하는 역할을 자연물에 비유해 설명하고, 생활에서 금 기운을 살리는 법을 아주 구체적으로: 어울리는 색(흰색·은색 계열), 곁에 두면 좋은 물건·소재, 자주 찾으면 좋은 공간, 가까이하면 좋은 사람 유형까지. 마지막에 이 기운을 잘 쓰면 얻게 되는 결실을 서술.
### 희신 — 희신 土가 용신을 어떻게 받쳐주는지 자연물 비유로 설명하고, 같은 방식으로 색·물건·공간·사람 유형과 기대 효과를 구체적으로.
### 기신 — 기신 火가 왜 위험한 기운인지 자연물 비유로 설명하고, 피해야 할 색·물건·장소·사람 유형과, 얽히면 생기는 문제, 경계했을 때 얻는 안정까지 구체적으로.
각 소제목 아래 750~900자, 전체 3,100~3,500자. 일주 성격 분석은 앞 파트 몫이므로 반복 금지.`;

async function gen(): Promise<string> {
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

const text = await gen();
console.error(`생성 완료 — ${text.length}자`);
writeFileSync(outPath, renderBody(text), "utf-8");
console.error(`저장: ${outPath}`);
