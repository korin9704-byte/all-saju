"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** 헤더 우측 햄버거 메뉴 — 클릭 시 오른쪽 사이드 드로어 노출 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
              className="absolute right-0 top-0 h-full w-64 bg-white flex flex-col"
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
                  <>
                    <MenuLink href="/mypage">마이페이지</MenuLink>
                    <form action="/api/auth/signout" method="post">
                      <button
                        type="submit"
                        className="block w-full px-6 py-4 text-left text-sm font-medium text-ink transition-colors hover:bg-[#F3EDFB]"
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
            </aside>
          </div>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-6 py-4 text-sm font-medium text-ink transition-colors hover:bg-[#F3EDFB]">
      {children}
    </Link>
  );
}
