"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** 헤더 우측 햄버거 메뉴 — 클릭 시 전체 화면 메뉴 노출 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 메뉴 열림 동안 배경 스크롤 잠금
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
        className="flex h-10 w-10 items-center justify-center -mr-2"
      >
        {/* 세 줄 햄버거 — 같은 길이 3줄 */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="4" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center" style={{ backgroundColor: "#F8F4FD" }}>
          <div className="w-full max-w-md flex flex-col">
            {/* 상단 바 — 로고 + 닫기 */}
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)} className="font-bold text-[22px] text-ink tracking-[0.08em]">
                냥점
              </Link>
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center -mr-2 text-ink"
              >
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="6" y1="6" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="20" y1="6" x2="6" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 메뉴 항목 — 가운데 정렬 큰 글씨 */}
            <nav className="flex-1 flex flex-col items-center justify-center gap-10 -mt-14">
              {isLoggedIn ? (
                <>
                  <MenuLink href="/mypage">마이페이지</MenuLink>
                  <form action="/api/auth/signout" method="post">
                    <button
                      type="submit"
                      className="text-2xl font-bold text-ink transition-colors hover:text-[#C95FC0]"
                    >
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <MenuLink href="/login">로그인</MenuLink>
                  <MenuLink href="/signup">회원가입</MenuLink>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-2xl font-bold text-ink transition-colors hover:text-[#C95FC0]">
      {children}
    </Link>
  );
}
