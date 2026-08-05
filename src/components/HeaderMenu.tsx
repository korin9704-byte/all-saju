"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/** 헤더 우측 햄버거 메뉴 — 클릭 시 오른쪽 사이드 드로어 노출 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const pathname = usePathname();

  // 로그인 페이지를 거치지 않고 바로 카카오 인증으로 이동
  async function startKakao() {
    if (authLoading) return;
    setAuthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname || "/")}`,
        scopes: "account_email profile_nickname",
      },
    });
    if (error) {
      setAuthLoading(false);
      toast.error("카카오 로그인을 시작할 수 없어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어 열림 동안 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center -mr-2 text-[#C95FC0]"
      >
        {/* 냥이 발바닥 아이콘 */}
        <img src="/images/paw.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <style>{`
            @keyframes drawerIn {
              from { transform: translateX(100%); }
              to   { transform: translateX(0); }
            }
            @keyframes backdropIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
          {/* 앱 셸 폭에 맞춘 컨테이너 */}
          <div className="mx-auto w-full max-w-md h-full relative overflow-hidden">
            {/* 반투명 배경 — 클릭 시 닫기 */}
            <div
              className="absolute inset-0 bg-black/40"
              style={{ animation: "backdropIn 0.2s ease-out" }}
              onClick={() => setOpen(false)}
            />
            {/* 드로어 */}
            <aside
              className="absolute right-0 top-0 h-full w-64 bg-[#F8F4FD] flex flex-col"
              style={{ animation: "drawerIn 0.22s ease-out", boxShadow: "-8px 0 32px rgba(74,58,114,0.18)" }}
            >
              {/* 상단 — 닫기 버튼 */}
              <div className="flex h-14 items-center justify-end px-4">
                <button
                  type="button"
                  aria-label="메뉴 닫기"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center text-ink"
                >
                  <svg width="24" height="24" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="6" y1="6" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="6" x2="6" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* 메뉴 항목 */}
              <nav className="flex flex-col divide-y divide-[#F3EDFB]">
                {/* 상품이 고민 사주 하나뿐이라 상품 메뉴는 숨김 */}
                {isLoggedIn ? (
                  /* 로그아웃은 마이페이지 안에서 제공 — 사이드바에는 미노출 */
                  <MenuLink href="/mypage">마이페이지</MenuLink>
                ) : (
                  <div className="px-4 py-2 text-center">
                    {/* 카카오 채널 추가 버튼 스타일 — 노란 알약형 */}
                    <button
                      type="button"
                      onClick={startKakao}
                      disabled={authLoading}
                      className="inline-flex h-9 items-center rounded px-3 text-[12px] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: "#FAE100", color: "#191919" }}
                    >
                      {authLoading ? "카카오로 이동 중..." : "카카오 1초 로그인/회원가입"}
                    </button>
                  </div>
                )}
              </nav>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 px-6 py-4 text-sm font-medium text-ink transition-colors hover:bg-[#F3EDFB]">
      {/* 화살표 기호 — 메뉴 항목 앞에 표시 */}
      <span className="shrink-0 text-[#C95FC0]">▸</span>
      {children}
    </Link>
  );
}
