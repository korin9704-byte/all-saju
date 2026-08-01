"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** 헤더 우측 햄버거 메뉴 — 클릭 시 드롭다운으로 메뉴 노출 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 바깥 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="메뉴"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center -mr-2"
      >
        {/* 세 줄 햄버거 — 같은 길이 3줄 */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          {open ? (
            <>
              <line x1="6" y1="6" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="20" y1="6" x2="6" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="4" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="4" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <style>{`
            @keyframes menuDrop {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <nav
            className="absolute right-0 top-12 z-50 w-48 rounded-2xl bg-white border border-[#E7DDF8] py-2 overflow-hidden divide-y divide-[#F3EDFB]"
            style={{ boxShadow: "0 12px 32px rgba(143,123,214,0.28)", animation: "menuDrop 0.18s ease-out" }}
          >
            {/* 상품이 고민 사주 하나뿐이라 상품 메뉴는 숨김 */}
            {isLoggedIn ? (
              <>
                <MenuLink href="/mypage">마이페이지</MenuLink>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="block w-full px-5 py-3.5 text-left text-sm font-medium text-ink transition-colors hover:bg-[#F3EDFB]"
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
        </>
      )}
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-5 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-[#F3EDFB]">
      {children}
    </Link>
  );
}
