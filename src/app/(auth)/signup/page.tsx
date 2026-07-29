"use client";

// 카카오 온리 회원가입 (이메일 가입 UI 제거 — 로그인과 동일 정책)
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

export default function SignupPage() {
  return (
    <div className="container pt-6 pb-16 max-w-md">
      {/* 회원가입 일러스트 */}
      <img src="/images/register.webp" alt="" className="w-full rounded-2xl mb-4" />
      <KakaoLoginButton label="카카오 1초 회원가입" />
    </div>
  );
}
