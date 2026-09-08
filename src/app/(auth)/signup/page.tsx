"use client";

// 카카오 온리 회원가입
import Image from "next/image";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { AuthStars } from "@/components/auth/AuthStars";

export default function SignupPage() {
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
        <KakaoLoginButton label="카카오 1초 Register" />
      </div>
    </div>
  );
}
