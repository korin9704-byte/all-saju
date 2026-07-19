"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** 로그인 후 돌아갈 경로 (예: "/products/today-fortune?resume=1") */
  next?: string;
  label?: string;
};

function KakaoSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 3C6.48 3 2 6.36 2 10.5c0 2.64 1.74 4.96 4.36 6.3l-.9 3.32c-.08.3.26.54.52.37l3.98-2.64c.66.09 1.34.15 2.04.15 5.52 0 10-3.36 10-7.5S17.52 3 12 3Z"
        fill="#191919"
      />
    </svg>
  );
}

export function KakaoLoginButton({ next = "/mypage", label = "카카오로 1초 시작하기" }: Props) {
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
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: "#FEE500", color: "#191919" }}
    >
      <KakaoSymbol />
      {loading ? "카카오로 이동 중..." : label}
    </button>
  );
}
