"use client";

// 카카오 온리 로그인
import { Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { AuthStars } from "@/components/auth/AuthStars";

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
    <div className="relative container py-16 max-w-md">
      <AuthStars />
      <Image
        src="/images/login.png"
        alt="로그인"
        width={2528}
        height={1696}
        priority
        className="relative mb-8 w-full rounded-2xl"
      />
      <div className="relative">
        <KakaoLoginButton next={redirectTo} label="카카오 1초 Login" />
      </div>
    </div>
  );
}
