"use client";

// 카카오 온리 회원가입 (이메일 가입 UI 제거 — 로그인과 동일 정책)
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

export default function SignupPage() {
  return (
    <div className="container py-16 max-w-md">
      <KakaoLoginButton label="카카오 1초 회원가입" />
    </div>
  );
}
