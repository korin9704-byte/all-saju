import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { siteConfig, businessInfo } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import MetaPixel from "@/components/MetaPixel";
import { HeaderMenu } from "@/components/HeaderMenu";
import { KakaoScript } from "@/components/KakaoScript";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    locale: "ko_KR",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 로그인 여부에 따라 헤더 메뉴 분기. Supabase 미설정(데모) 모드면 무조건 비로그인 취급.
  const isLoggedIn = isSupabaseConfigured() ? !!(await getCurrentUser()) : false;

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 본문: 고운돋움 / 메뉴 항목: 도현 */}
        <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Do+Hyeon&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="bg-[#EFE7FA]">
        <MetaPixel pixelId="2209519539888659" />
        <KakaoScript />
        {/* 앱형 셸 — 모바일 폭(448px) 칼럼을 가운데 고정, 안쪽은 무료 페이지와 같은 연보라 배경 */}
        <div className="mx-auto w-full max-w-md min-h-screen bg-[#F8F4FD] flex flex-col shadow-[0_0_32px_rgba(143,123,214,0.12)]">
          <SiteHeader isLoggedIn={isLoggedIn} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

// Ollama: 56px utility nav, primary nav on canvas, no shadow.
function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="border-b border-hairline bg-[#F8F4FD]">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="text-[23px] text-ink tracking-[0.08em]"
          style={{ fontFamily: "'Do Hyeon', 'Gowun Dodum', sans-serif" }}
        >
          냥점
        </Link>
        <HeaderMenu isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}

// Ollama: footer is a quiet caption-gray strip with hairline divider.
function SiteFooter() {
  // 사업자정보 한 줄 — 운세위키 푸터 포맷: "회사 | 사업자등록번호: ... | 통신판매업 신고번호: ... | 대표: ... | 주소: ..."
  const businessLine = [
    businessInfo.companyName,
    `사업자등록번호: ${businessInfo.businessNumber}`,
    `통신판매업 신고번호: ${businessInfo.mailOrderNumber}`,
    `대표: ${businessInfo.representative}`,
    `주소: ${businessInfo.address}`,
  ].join(" | ");

  const contactLine = [
    `고객센터: ${businessInfo.email}`,
    businessInfo.phone
      ? `핸드폰${businessInfo.phoneNote ? `(${businessInfo.phoneNote})` : ""}: ${businessInfo.phone}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <footer className="border-t border-hairline mt-20">
      <div className="container py-10 text-xs text-body space-y-4">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <Link href="/legal/terms" className="hover:text-ink">이용약관</Link>
          <Link href="/legal/privacy" className="hover:text-ink">개인정보처리방침</Link>
          <Link href="/legal/refund-policy" className="hover:text-ink">환불정책</Link>
        </div>
        <p className="text-mute leading-relaxed">{businessLine}</p>
        <p className="text-mute leading-relaxed">{contactLine}</p>
        <p className="text-mute">© {new Date().getFullYear()} {siteConfig.name}</p>
      </div>
    </footer>
  );
}
