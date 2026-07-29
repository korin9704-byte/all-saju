"use client";

// 카카오 온리 로그인 (이메일 로그인 UI 제거 — /signup·/reset 라우트는 기존 회원 대비용으로 유지)
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const search = useSearchParams();
  const redirectTo = search.get("redirect") ?? "/mypage";

  return (
    <div className="container pt-6 pb-16 max-w-md">
      {/* 로그인 일러스트 */}
      <img src="/images/login.webp" alt="" className="w-full rounded-2xl mb-4" />
      <KakaoLoginButton next={redirectTo} label="카카오 1초 로그인" />
    </div>
  );
}
