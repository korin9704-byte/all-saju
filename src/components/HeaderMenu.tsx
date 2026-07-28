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
        <nav className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-hairline bg-[#F8F4FD] py-2 shadow-lg">
          <MenuLink href="/products">상품</MenuLink>
          {isLoggedIn ? (
            <>
              <MenuLink href="/mypage">마이페이지</MenuLink>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="block w-full px-5 py-3 text-left text-sm font-medium text-ink hover:bg-[#F3EDFB]"
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
      )}
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-5 py-3 text-sm font-medium text-ink hover:bg-[#F3EDFB]">
      {children}
    </Link>
  );
}
