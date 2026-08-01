"use client";

import Link from "next/link";

/** 헤더 우측 메뉴 — 햄버거 없이 텍스트 링크로 바로 노출 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav className="flex items-center gap-6 text-[13px] font-medium">
      {/* 상품이 고민 사주 하나뿐이라 상품 메뉴는 숨김 */}
      {isLoggedIn ? (
        <>
          <Link href="/mypage" className="text-ink hover:text-body">마이페이지</Link>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-ink hover:text-body">로그아웃</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login" className="text-ink hover:text-body">로그인</Link>
          <Link href="/signup" className="text-ink hover:text-body">회원가입</Link>
        </>
      )}
    </nav>
  );
}
