import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { FreeTroubleWizard } from "@/components/saju/FreeTroubleWizard";

// 비공개 링크 전용 — 무료 고민 사주 (검색엔진 노출 금지)
export const metadata = {
  title: "무료 고민 사주",
  robots: { index: false, follow: false },
};

export default async function FreeTroublePage() {
  if (!isSupabaseConfigured()) notFound();

  const service = createServiceClient();
  const { data: product } = await service
    .from("products")
    .select("id")
    .eq("slug", "trouble-saju-free")
    .maybeSingle();

  if (!product) notFound();

  return <FreeTroubleWizard productId={product.id} />;
}
