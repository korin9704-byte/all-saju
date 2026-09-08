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
        {/* 낙관 도장 사각 + 흰 3줄 */}
        <svg width="26" height="26" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="2.5" y="2.5" width="17" height="17" rx="4.5" fill="#C95FC0" />
          <path d="M6.5 7.5 H15.5 M6.5 11 H13.5 M6.5 14.5 H12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
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
            {/* 드로어 밖 좌측, 배경 위에 떠 있는 닫기 — 흰 원형 + 낙관 도장 ✕ */}
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={() => setOpen(false)}
              className="absolute top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-opacity hover:opacity-80"
              style={{ right: "calc(min(66%, 300px) + 12px)", animation: "backdropIn 0.25s ease-out" }}
            >
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="2.5" y="2.5" width="17" height="17" rx="4.5" fill="#C95FC0" />
                <path d="M7.5 7.5 L14.5 14.5 M14.5 7.5 L7.5 14.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {/* 우측 드로어 */}
            <div
              className="absolute top-0 right-0 bottom-0 w-[66%] max-w-[300px] bg-[#F8F4FD] pt-4 overflow-y-auto"
              style={{ animation: "drawerIn 0.25s ease-out", boxShadow: "-8px 0 28px rgba(74,58,114,0.22)" }}
            >
              {/* 상단 — '메뉴' 타이틀 */}
              <div className="flex h-[41px] items-center px-[20px] pb-3 border-b border-[#E7DDF8]">
                <span
                  className="flex h-6 items-center text-[17px] leading-none text-ink"
                  style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
                >
                  Menu
                </span>
              </div>

              {/* 메뉴 항목 — 구분선 없이 */}
              <nav className="flex flex-col">
                <MenuLink href="/products/trouble-saju">고민 사주</MenuLink>
                <MenuLink href="/products/life-saju">인생 사주</MenuLink>
                {/* 출시 예정 — 링크 없음 */}
                <span
                  className="flex items-center gap-2 px-[20px] py-[14px] text-[16px] leading-[1.6] text-mute"
                  style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
                  aria-disabled
                >
                  재회 사주
                  <span className="rounded-full bg-[#F3EDFB] px-2 py-0.5 text-[11px] text-[#8F7BD6]">Coming Soon</span>
                </span>
                {/* 상품 메뉴와 계정 메뉴 구분선 */}
                <div className="mx-[20px] my-[6px] border-t border-[#E7DDF8]" />
                {isLoggedIn ? (
                  <>
                    <MenuLink href="/mypage">My Page</MenuLink>
                    <form action="/api/auth/signout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center px-[20px] py-[12px] text-left text-[16px] leading-[1.6] text-ink transition-colors hover:bg-[#F3EDFB]"
                        style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
                      >
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <MenuLink href="/login">Login</MenuLink>
                    <MenuLink href="/signup">Register</MenuLink>
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
      className="flex items-center px-[20px] py-[12px] text-[16px] leading-[1.6] text-ink transition-colors hover:bg-[#F3EDFB]"
      style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
    >
      {children}
    </Link>
  );
}
