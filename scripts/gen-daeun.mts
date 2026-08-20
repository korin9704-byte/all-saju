// 일주 분석 파트 재생성 (참고 리포트 구성: 내 사주의 특징 / 생활방식 / 행동성향 / 내면성향)
// 실행: pnpm tsx scripts/gen-daeun.mts <full-response.json> <출력.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outPath] = process.argv;
if (!inputPath || !outPath) { console.error("usage: gen-daeun.mts <full.json> <out.html>"); process.exit(1); }

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

const daeunCtx = data.daeun.all_daeun.map((x: Api) =>
  `[${x.age_start}세 ${x.ganji}(${x.ganji_hanja}) 대운] 십성 ${x.sipseong?.gan}/${x.sipseong?.ji}, 12운성 ${x.twelveFortune?.fortune}(${x.twelveFortune?.interpretation?.keyword ?? ""})`
).join("\n");

const mkBrief = (list: Api[], note: string) => `시기별 대운 풀이 — ${PERSON.name}님의 대운을 10년 단위로 하나씩 깊게 풀이. 반드시 아래 소제목을 이 순서로, 뒤에 다른 문구를 덧붙이지 말고 그대로 사용:
${list.map((x: Api) => `### ${x.age_start}세~${x.age_start + 9}세 ${x.ganji}(${x.ganji_hanja}) 대운`).join("\n")}
각 대운마다: 그 시기의 전체 분위기(그 대운의 십성·12운성 근거를 쉬운 말로), 일·돈·관계·마음의 구체적 장면, 조심할 것과 살릴 것. 각 소제목 아래 600~750자.${note}`;

const past = data.daeun.all_daeun.slice(0, 5);
const future = data.daeun.all_daeun.slice(5);
const brief1 = mkBrief(past, " 이미 지난 대운(3~23세)은 '그때 그랬던 이유'를 복기하는 톤으로, 현재 정축 대운(33세)은 지금 한복판이므로 가장 깊게.") + "\n" + daeunCtx;
const brief2 = mkBrief(future, " 아직 오지 않은 대운이므로 미래를 그려주는 톤으로. 노년 대운일수록 건강·관계 당부를 곁들일 것. 앞선 대운들과 중복 금지.") + "\n" + daeunCtx;

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
