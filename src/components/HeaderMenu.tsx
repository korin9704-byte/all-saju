"use client";

import Link from "next/link";

/** 헤더 우측 — 메뉴바 없이 바로 노출: 비로그인은 카카오 로그인 버튼, 로그인 시 마이페이지·로그아웃 */
export function HeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return (
      <nav className="flex items-center gap-6 text-[13px] font-medium">
        <Link href="/mypage" className="text-ink hover:text-body">마이페이지</Link>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-ink hover:text-body">로그아웃</button>
        </form>
      </nav>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded px-4 py-2.5 text-[13px] font-bold transition-opacity hover:opacity-90"
      style={{ background: "#ffd520", color: "#191919" }}
    >
      카카오 1초 로그인/회원가입
    </Link>
  );
}
