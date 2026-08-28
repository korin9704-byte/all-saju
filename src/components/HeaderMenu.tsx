"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** 헤더 우측 메뉴 — 발바닥 아이콘 클릭 시 화면 아래에서 바텀 시트 노출 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 시트 열림 동안 배경 스크롤 잠금
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
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center transition-opacity hover:opacity-70"
      >
        {/* 배경 원 없이 짧아지는 3줄 */}
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 6 H18 M4 11 H14 M4 16 H10" stroke="#4A3A72" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* 시트는 body 포털로 — sticky/transform 조상 안에서도 화면 전체 기준으로 뜨게 */}
      {open && createPortal(
        <div className="fixed inset-0 z-[70]">
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
            {/* 우측 드로어 */}
            <div
              className="absolute top-0 right-0 bottom-0 w-[66%] max-w-[300px] bg-[#F8F4FD] pt-4 overflow-y-auto"
              style={{ animation: "drawerIn 0.25s ease-out", boxShadow: "-8px 0 28px rgba(74,58,114,0.22)" }}
            >
              {/* 상단 — '메뉴' 타이틀 + 닫기 */}
              <div className="flex items-center justify-between px-[20px] pb-3 border-b border-[#E7DDF8]">
                <span
                  className="flex h-6 items-center text-[17px] leading-none text-ink"
                  style={{ fontFamily: "'Do Hyeon', 'Gowun Dodum', sans-serif" }}
                >
                  메뉴
                </span>
                <button
                  type="button"
                  aria-label="메뉴 닫기"
                  onClick={() => setOpen(false)}
                  className="relative -top-[4px] flex h-6 w-6 items-center justify-center text-body"
                >
                  {/* 굵은 ✕ (SVG) */}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M5 5 L15 15 M15 5 L5 15" stroke="#C95FC0" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* 메뉴 항목 — 구분선 없이 */}
              <nav className="flex flex-col">
                <MenuLink href="/products/trouble-saju">고민 사주</MenuLink>
                <MenuLink href="/products/life-saju">인생 사주</MenuLink>
                {isLoggedIn ? (
                  <>
                    <MenuLink href="/mypage">마이페이지</MenuLink>
                    <form action="/api/auth/signout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center px-[20px] py-[12px] text-left text-[15px] leading-[1.6] text-ink transition-colors hover:bg-[#F3EDFB]"
                        style={{ fontFamily: "'Do Hyeon', 'Gowun Dodum', sans-serif" }}
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
        </div>,
        document.body,
      )}
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-[20px] py-[12px] text-[15px] leading-[1.6] text-ink transition-colors hover:bg-[#F3EDFB]"
      style={{ fontFamily: "'Do Hyeon', 'Gowun Dodum', sans-serif" }}
    >
      {children}
    </Link>
  );
}
