"use client";

// 카카오 온리 회원가입 (이메일 가입 UI 제거 — 로그인과 동일 정책)
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <KakaoLoginButton label="카카오 1초 회원가입" />
          <p className="mt-4 text-xs text-center text-muted-foreground">
            가입 시 <a href="/legal/terms" className="underline" target="_blank">이용약관</a>과{" "}
            <a href="/legal/privacy" className="underline" target="_blank">개인정보처리방침</a>에 동의하게 됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
