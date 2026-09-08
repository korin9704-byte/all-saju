"use client";

// 카카오 온리 로그인 (이메일 로그인 UI 제거 — /signup·/reset 라우트는 기존 회원 대비용으로 유지)
import { Suspense } from "react";
import Image from "next/image";
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
    <div className="container py-16 max-w-md">
      <Image
        src="/images/register.png"
        alt="냥점 시작하기"
        width={2528}
        height={1696}
        priority
        className="mb-8 w-full rounded-2xl"
      />
      <KakaoLoginButton next={redirectTo} label="카카오로 시작하기" />
    </div>
  );
}
