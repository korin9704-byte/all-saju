// =====================================================
// 화격/가화격 판정 규칙 역추정용 표적 수집
// =====================================================
// 실행: pnpm tsx scripts/probe-hwagyeok.mts [N] > 출력.jsonl
// 로컬 만세력으로 "일간이 월간/시간과 천간합" 인 케이스만 먼저 걸러낸 뒤
// 그 케이스만 API 에 질의한다 (무작위 질의 대비 호출량 1/6 수준).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeLocalAnalysisWithGender } from "../src/lib/saju/local-analysis";

function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (name: string) => raw.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  return { url: get("SAJU_API_URL")!, key: get("SAJU_API_KEY")! };
}

const HAP: [string, string, string][] = [
  ["갑", "기", "토"], ["을", "경", "금"], ["병", "신", "수"], ["정", "임", "목"], ["무", "계", "화"],
];

let seed = parseInt(process.env.PROBE_SEED ?? "12260901", 10);
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

async function main() {
  const env = loadEnv();
  const want = parseInt(process.argv[2] ?? "50", 10);
  let sent = 0, scanned = 0;
  while (sent < want && scanned < 200000) {
    scanned++;
    const c = {
      birthYear: String(1950 + Math.floor(rand() * 60)),
      birthMonth: String(1 + Math.floor(rand() * 12)),
      birthDay: String(1 + Math.floor(rand() * 28)),
      birthHour: String(Math.floor(rand() * 24)),
      birthMinute: String(Math.floor(rand() * 60)),
      calendarType: "양력" as const,
      gender: rand() < 0.5 ? ("male" as const) : ("female" as const),
    };
    const local = computeLocalAnalysisWithGender(c);
    const d = local.ganji.day.gan;
    const partners = [local.ganji.month.gan, local.ganji.hour?.gan].filter(Boolean) as string[];
    const hasHap = partners.some((pg) => HAP.some(([x, y]) => (x === d && y === pg) || (x === pg && y === d)));
    if (!hasHap) continue;
    const res = await fetch(env.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SajuBookClient/1.0", "X-SAJU-BOOK-API-KEY": env.key },
      body: JSON.stringify({ ...c, fields: ["ganji", "sipseong", "sinStrength", "gyeokguk"] }),
    });
    if (!res.ok) { console.error(`skip: ${res.status}`); continue; }
    const j = await res.json();
    console.log(JSON.stringify({ input: c, ganji: j.ganji, sipseong: j.sipseong?.sipseongs, summary: j.sipseong?.summary, sinStrength: j.sinStrength, gyeokguk: j.gyeokguk }));
    sent++;
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error(`${scanned}건 스캔 → ${sent}건 질의`);
}

main().catch((e) => { console.error(e); process.exit(1); });
