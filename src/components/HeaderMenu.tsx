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
        className="flex h-10 w-10 items-center justify-center -mr-2"
      >
        {/* 햄버거 메뉴 아이콘 */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3.5 5.5 H18.5 M3.5 11 H18.5 M3.5 16.5 H18.5" stroke="#4A3A72" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* 시트는 body 포털로 — sticky/transform 조상 안에서도 화면 전체 기준으로 뜨게 */}
      {open && createPortal(
        <div className="fixed inset-0 z-[70]">
          <style>{`
            @keyframes sheetUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
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
            {/* 바텀 시트 */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[#F8F4FD] pb-8"
              style={{ animation: "sheetUp 0.25s ease-out", boxShadow: "0 -8px 32px rgba(74,58,114,0.18)" }}
            >
              {/* 핸들 바 */}
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="flex w-full justify-center pt-3 pb-2"
              >
                <span className="h-1.5 w-10 rounded-full bg-[#D8CCEE]" />
              </button>

              {/* 메뉴 항목 — 2열 카드 그리드 */}
              <nav className="grid grid-cols-2 gap-2.5 px-5 pt-1">
                <MenuLink href="/products/trouble-saju">고민 사주</MenuLink>
                <MenuLink href="/products/life-saju">인생 사주</MenuLink>
                <MenuLink href="/reviews">리뷰</MenuLink>
                {isLoggedIn ? (
                  <>
                    <MenuLink href="/mypage">마이페이지</MenuLink>
                    <form action="/api/auth/signout" method="post" className="contents">
                      <button type="submit" className={CARD_CLS}>
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

// 2열 카드 공통 스타일
const CARD_CLS =
  "flex items-center rounded-2xl bg-white border border-[#E7DDF8] px-4 py-4 text-sm font-medium text-ink text-left transition-colors hover:bg-[#F3EDFB]";

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={CARD_CLS}>
      {children}
    </Link>
  );
}
