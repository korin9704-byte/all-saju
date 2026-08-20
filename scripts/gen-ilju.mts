// 일주 분석 파트 재생성 (참고 리포트 구성: 내 사주의 특징 / 생활방식 / 행동성향 / 내면성향)
// 실행: pnpm tsx scripts/gen-ilju.mts <full-response.json> <출력.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outPath] = process.argv;
if (!inputPath || !outPath) { console.error("usage: gen-ilju.mts <full.json> <out.html>"); process.exit(1); }

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

const brief = `일주 분석 — ${PERSON.name}님의 일주(${g.day.gan}${g.day.ji})를 중심으로 한 사람 됨됨이 분석. 반드시 아래 네 소제목을 이 순서로 사용:
### 내 사주의 특징 — 첫 문장은 "${PERSON.name}님은 신강한 ${g.day.gan}${g.day.ji}일주예요." 로 시작해, 일주를 자연물 형상(잘 벼린 칼이 깊은 흙 위에 선 모습 등)에 비유하고, 원국 전체 구도(천간의 금 반복, 지지의 화 단련)와 신강함이 만드는 가장 큰 특징을 서술.
### 생활방식 — 겉으로 보이는 일상과 실제 살아가는 방식의 대비, 일·이동·소비·자기계발 습관을 구체 장면으로.
### 행동성향 — 평소 행동과 결정적 순간의 차이, 관계에서의 단호함과 예민함이 드러나는 장면.
### 내면성향 — 남에게 들키고 싶지 않은 속마음, 자기 통제와 완벽주의, 그것이 힘이 되는 면과 갉아먹는 면.
각 소제목 아래 750~900자, 전체 3,100~3,500자. 오행 개수·용신 얘기는 다른 장 몫이므로 금지.`;

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
