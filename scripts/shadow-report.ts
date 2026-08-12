// =====================================================
// 섀도 대조 기록 집계 — 항목별 일치율 리포트
// =====================================================
// 실행: pnpm tsx scripts/shadow-report.ts [--days N]
// Supabase Storage(shadow-diffs)에 쌓인 실판매 대조 기록을 내려받아
// 항목별 불일치 빈도와 추이를 출력한다.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): { url: string; key: string } {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  const get = (name: string) => raw.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  const url = get("NEXT_PUBLIC_SUPABASE_URL");
  const key = get("SUPABASE_SERVICE_ROLE_KEY") ?? get("SUPABASE_SECRET_KEY");
  if (!url || !key) throw new Error("Supabase env 없음");
  return { url, key };
}

async function main() {
  const { url, key } = loadEnv();
  const supabase = createClient(url, key);
  const daysArg = process.argv.indexOf("--days");
  const days = daysArg >= 0 ? parseInt(process.argv[daysArg + 1], 10) : 14;

  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400_000);
    dates.push(d.toISOString().slice(0, 10));
  }

  let total = 0;
  let clean = 0;
  const fieldMisses: Record<string, number> = {};
  const byDay: Record<string, { total: number; clean: number }> = {};

  for (const day of dates) {
    const { data: files, error } = await supabase.storage.from("shadow-diffs").list(day, { limit: 1000 });
    if (error || !files?.length) continue;
    for (const f of files) {
      const { data } = await supabase.storage.from("shadow-diffs").download(`${day}/${f.name}`);
      if (!data) continue;
      const rec = JSON.parse(await data.text()) as { diffCount: number; diffs: string[] };
      total++;
      byDay[day] = byDay[day] ?? { total: 0, clean: 0 };
      byDay[day].total++;
      if (rec.diffCount === 0) { clean++; byDay[day].clean++; continue; }
      for (const d of rec.diffs) {
        const field = d.split(":")[0];
        fieldMisses[field] = (fieldMisses[field] ?? 0) + 1;
      }
    }
  }

  if (total === 0) { console.log("기록 없음"); return; }
  console.log(`===== 섀도 대조 리포트 (최근 ${days}일, ${total}건) =====`);
  console.log(`완전 일치: ${clean}/${total} (${Math.round((100 * clean) / total)}%)\n`);
  console.log("항목별 불일치 건수:");
  for (const [k, v] of Object.entries(fieldMisses).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(24)} ${v}건 (${Math.round((100 * v) / total)}%)`);
  }
  console.log("\n일자별:");
  for (const [day, v] of Object.entries(byDay).sort()) {
    console.log(`  ${day}  ${v.clean}/${v.total} 완전 일치`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
