// =====================================================
// 신강 점수·격국 산식 역추정용 데이터 수집
// =====================================================
// 실행: pnpm tsx scripts/probe-strength.ts [N] > 출력.jsonl
// 랜덤 케이스 N개(기본 40)의 ganji + sinStrength + gyeokguk 응답을 JSONL 로 출력.

import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (name: string) => raw.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  return { url: get("SAJU_API_URL")!, key: get("SAJU_API_KEY")! };
}

let seed = parseInt(process.env.PROBE_SEED ?? "77260813", 10);
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

async function main() {
  const env = loadEnv();
  const n = parseInt(process.argv[2] ?? "40", 10);
  for (let i = 0; i < n; i++) {
    const c = {
      birthYear: String(1950 + Math.floor(rand() * 60)),
      birthMonth: String(1 + Math.floor(rand() * 12)),
      birthDay: String(1 + Math.floor(rand() * 28)),
      birthHour: String(Math.floor(rand() * 24)),
      birthMinute: String(Math.floor(rand() * 60)),
      calendarType: "양력",
      gender: rand() < 0.5 ? "male" : "female",
    };
    const res = await fetch(env.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "SajuBookClient/1.0", "X-SAJU-BOOK-API-KEY": env.key },
      body: JSON.stringify({ ...c, fields: ["ganji", "sipseong", "sinStrength", "gyeokguk"] }),
    });
    if (!res.ok) { console.error(`skip ${i}: ${res.status}`); continue; }
    const j = await res.json();
    console.log(JSON.stringify({ input: c, ganji: j.ganji, sipseong: j.sipseong?.sipseongs, summary: j.sipseong?.summary, sinStrength: j.sinStrength, gyeokguk: j.gyeokguk }));
    await new Promise((r) => setTimeout(r, 250));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
