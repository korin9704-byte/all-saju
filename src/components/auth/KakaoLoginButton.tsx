"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** 로그인 후 돌아갈 경로 (예: "/resume") */
  next?: string;
  label?: string;
};

export function KakaoLoginButton({ next = "/mypage", label = "카카오 1초 로그인" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "account_email profile_nickname",
      },
    });
    if (error) {
      setLoading(false);
      toast.error("카카오 로그인을 시작할 수 없어요. 잠시 후 다시 시도해 주세요");
      console.error("[kakao] signInWithOAuth:", error.message);
    }
    // 성공 시 카카오로 리다이렉트되므로 loading 해제 불필요
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(buttonVariants(), "w-full hover:opacity-90")}
      style={{ background: "#ffd520", color: "#191919" }}
    >
      {loading ? "카카오로 이동 중..." : label}
    </button>
  );
}
