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
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#F3EDFB] transition-colors hover:bg-[#E7DDF8]"
      >
        {/* 뷰어 '목차' 버튼과 같은 원형 소프트 배경 + 햄버거 아이콘 */}
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 6 H18 M4 11 H18 M4 16 H18" stroke="#4A3A72" strokeWidth="1.6" strokeLinecap="round" />
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
              {/* 닫기 */}
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="flex w-full justify-end px-4 pb-2 text-[18px] leading-none text-body"
              >
                ✕
              </button>

              {/* 메뉴 항목 — 목차와 같은 담백 리스트(얇은 구분선) + 01. 번호 */}
              <nav className="flex flex-col divide-y divide-[#F1EAFB]">
                <MenuLink href="/products/trouble-saju">고민 사주</MenuLink>
                <MenuLink href="/products/life-saju">인생 사주</MenuLink>
                <MenuLink href="/reviews">리뷰</MenuLink>
                {isLoggedIn ? (
                  <>
                    <MenuLink href="/mypage">마이페이지</MenuLink>
                    <form action="/api/auth/signout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center px-[20px] py-[12px] text-left text-[14px] leading-[1.6] text-ink transition-colors hover:bg-[#F3EDFB]"
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
    <Link href={href} className="flex items-center px-[20px] py-[12px] text-[14px] leading-[1.6] text-ink transition-colors hover:bg-[#F3EDFB]">
      {children}
    </Link>
  );
}
