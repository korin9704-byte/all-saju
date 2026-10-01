import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

// 사이트맵 — 홈·상품 목록·판매 중 상품 상세·약관 (개인 페이지는 제외)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // 판매 중인 상품 상세 — 목록 비노출 상품(번들·추가질문·무료·미니)은 제외
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const service = createServiceClient();
    const { data: products } = await service
      .from("products")
      .select("slug")
      .eq("is_active", true);
    productPages = (products ?? [])
      .filter(
        (p) =>
          !p.slug.endsWith("-bundle") &&
          !p.slug.endsWith("-followup") &&
          !p.slug.endsWith("-mini") &&
          !p.slug.endsWith("-free") &&
          p.slug !== "followup-question",
      )
      .map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // DB 조회 실패 시 정적 페이지만 반환
  }

  return [...staticPages, ...productPages];
}
