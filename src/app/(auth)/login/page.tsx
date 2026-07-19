"use client";

// 카카오 온리 로그인 (이메일 로그인 UI 제거 — /signup·/reset 라우트는 기존 회원 대비용으로 유지)
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle>로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <KakaoLoginButton next={redirectTo} label="카카오 1초 로그인" />
          <p className="mt-4 text-xs text-center text-muted-foreground">
            로그인 시 <a href="/legal/terms" className="underline" target="_blank">이용약관</a>과{" "}
            <a href="/legal/privacy" className="underline" target="_blank">개인정보처리방침</a>에 동의하게 됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
