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
      toast.error("카카오 로그인을 시작할 수 없어요. 잠시 후 다시 시도해 주세요.");
      console.error("[kakao] signInWithOAuth:", error.message);
    }
    // 성공 시 카카오로 리다이렉트되므로 loading 해제 불필요
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(buttonVariants(), "w-full h-12 rounded-full text-[14px] font-medium hover:opacity-90")}
      style={{ background: "#ffd520", color: "#191919" }}
    >
      {loading ? (
        "카카오로 이동 중..."
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          {/* 카카오 말풍선 심볼 */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.68 6.75-.15.52-.96 3.33-.99 3.55 0 0-.02.17.09.24.11.07.24.02.24.02.32-.04 3.68-2.41 4.26-2.82.56.08 1.13.12 1.72.12 5.52 0 10-3.58 10-8s-4.48-8-10-8z"
              fill="#191919"
            />
          </svg>
          {label}
        </span>
      )}
    </button>
  );
}
