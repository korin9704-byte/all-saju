// =====================================================
// 무료권 관리자 수동 지급
// =====================================================
// 실행: pnpm tsx scripts/grant-rewards.ts <이메일> <개수>
// 선행: supabase/migrations/0006_admin_reward_grant.sql 적용
//       (referred_user_id nullable — 지급 행은 null 로 들어간다)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const m = line.match(/^([A-Z_]+[A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const [, , email, countArg] = process.argv;
const count = parseInt(countArg ?? "1", 10);
if (!email || !Number.isInteger(count) || count < 1 || count > 50) {
  console.error("사용법: pnpm tsx scripts/grant-rewards.ts <이메일> <개수 1~50>");
  process.exit(1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

async function main() {
  // 이메일 → 유저
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`유저 목록 조회 실패: ${error.message}`);
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`유저 없음: ${email}`);

  const before = await sb.from("referral_rewards")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id).is("used_at", null);

  const rows = Array.from({ length: count }, () => ({ referrer_id: user.id }));
  const { error: insErr } = await sb.from("referral_rewards").insert(rows);
  if (insErr) throw new Error(`지급 실패: ${insErr.message} (0006 마이그레이션이 적용됐는지 확인)`);

  const after = await sb.from("referral_rewards")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id).is("used_at", null);

  console.log(`✓ ${email} (${user.id})`);
  console.log(`  무료권 ${count}개 지급 — 사용 가능: ${before.count ?? 0} → ${after.count ?? 0}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
