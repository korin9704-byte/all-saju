import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// 검색엔진 크롤링 규칙 — 공개 페이지만 허용, 개인·운영 영역은 차단
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/mypage",
          "/checkout/",
          "/results/",
          "/generating",
          "/free-trouble-mx7q92", // 비공개 링크 전용 무료 상품
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
