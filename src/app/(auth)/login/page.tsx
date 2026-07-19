"use client";

// 카카오 온리 로그인 (소프트 제거: 이메일 로그인 UI만 제거, /signup·/reset 라우트는 유지)
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
          <KakaoLoginButton next={redirectTo} />
          <p className="mt-4 text-xs text-center text-muted-foreground">
            로그인 시 <a href="/legal/terms" className="underline" target="_blank">이용약관</a>과{" "}
            <a href="/legal/privacy" className="underline" target="_blank">개인정보처리방침</a>에 동의하게 됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
