// 일주 분석 파트 재생성 (참고 리포트 구성: 내 사주의 특징 / 생활방식 / 행동성향 / 내면성향)
// 실행: pnpm tsx scripts/gen-wolun.mts <full-response.json> <출력.html>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outPath] = process.argv;
if (!inputPath || !outPath) { console.error("usage: gen-wolun.mts <full.json> <out.html>"); process.exit(1); }

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

const MONTHS = [
  "2026년 8월 병신 (편관/비견)", "2026년 9월 정유 (정관/겁재)", "2026년 10월 무술 (편인/편인)",
  "2026년 11월 기해 (정인/식신)", "2026년 12월 경자 (비견/상관)", "2027년 1월 신축 (겁재/정인)",
  "2027년 2월 임인 (식신/편재)", "2027년 3월 계묘 (상관/정재)", "2027년 4월 갑진 (편재/편인)",
  "2027년 5월 을사 (정재/편관)", "2027년 6월 병오 (편관/정관)", "2027년 7월 정미 (정관/정인)",
];
const brief = `월운 한 줄 평 — 아래 12개월 각각에 대해, 그 달의 간지·기운(십성)을 근거로 생활 조언 한 줄(12~18자, "~하기 좋은 달" / "~조심할 달" 식)을 작성.
${MONTHS.join(String.fromCharCode(10))}
출력 형식: 각 줄에 "YYYY년 M월|한 줄 평" 만. 다른 텍스트·소제목·강조 금지. 열두 줄 전부.`;

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
writeFileSync(outPath, text, "utf-8");
console.error(`저장: ${outPath}`);
