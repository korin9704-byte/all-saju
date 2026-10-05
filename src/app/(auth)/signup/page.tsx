"use client";

// 카카오 온리 회원가입
import { Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { AuthStars } from "@/components/auth/AuthStars";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const redirectTo = useSearchParams().get("redirect") ?? "/mypage";
  return (
    <div className="relative container py-16 max-w-md">
      <AuthStars />
      <Image
        src="/images/register.png"
        alt="회원가입"
        width={2528}
        height={1696}
        priority
        className="relative mb-8 w-full rounded-2xl"
      />
      <div className="relative">
        <KakaoLoginButton next={redirectTo} label="카카오 1초 Register" />
      </div>
    </div>
  );
}
