import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { REFERRAL_REWARD_CAP } from "@/lib/referral";

/** 내 추천 코드(없으면 생성) + 무료권 적립/보유 현황 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .maybeSingle();

  let code = profile?.referral_code ?? null;

  // 코드가 없으면 생성 (unique 충돌 시 재시도)
  if (!code) {
    for (let attempt = 0; attempt < 3 && !code; attempt++) {
      const candidate = nanoid(8);
      const { error } = await service
        .from("profiles")
        .update({ referral_code: candidate })
        .eq("id", user.id)
        .is("referral_code", null);
      if (!error) {
        code = candidate;
      }
    }
    if (!code) {
      // 동시 요청으로 이미 생성됐을 수 있음 — 재조회
      const { data: again } = await service
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .maybeSingle();
      code = again?.referral_code ?? null;
    }
  }

  if (!code) {
    return NextResponse.json({ error: "추천 코드 생성 실패" }, { status: 500 });
  }

  // 공유 자격: MINI가 아닌 상품의 풀버전 결과를 가진 사람만 (유료 구매·언락·무료권 사용 포함)
  const { data: paidOrders } = await service
    .from("orders")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("status", "paid");

  let canShare = false;
  if (paidOrders && paidOrders.length > 0) {
    const productIds = [...new Set(paidOrders.map((o) => o.product_id))];
    const { data: prods } = await service
      .from("products")
      .select("slug")
      .in("id", productIds);
    canShare = (prods ?? []).some((p) => !p.slug.endsWith("-mini"));
  }

  const { count: earned } = await service
    .from("referral_rewards")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const { count: available } = await service
    .from("referral_rewards")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .is("used_at", null);

  return NextResponse.json({
    code,
    canShare,
    earned: earned ?? 0,
    available: available ?? 0,
    cap: REFERRAL_REWARD_CAP,
  });
}
