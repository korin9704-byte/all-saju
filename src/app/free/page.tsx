import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { SajuForm } from "@/components/saju/SajuForm";

export const metadata = {
  title: "사주 해설 MINI",
  description: "사주 해설 13가지 주제 중 6가지를 무료로. 생년월일만 입력하면 3분 만에 확인할 수 있어요.",
  openGraph: {
    title: "사주 해설 MINI가 도착했어요 🎁",
    description: "13가지 주제 중 6가지를 무료로 볼 수 있어요. 생년월일만 입력하면 3분이면 끝!",
  },
};

export default async function FreeMiniPage() {
  let isLoggedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  }

  return (
    <div className="container py-12 max-w-lg">
      <header className="mb-8 text-center">
        <p className="text-xs font-mono text-mute mb-2">FREE MINI</p>
        <h1 className="text-3xl font-semibold tracking-tight">사주 해설 MINI</h1>
        <p className="mt-3 text-sm text-body leading-relaxed">
          13가지 주제로 풀어내는 내 사주 해설,
          <br />
          그중 6가지를 무료로 볼 수 있어요
        </p>
      </header>

      <SajuForm productId="" productSlug="today-fortune" isLoggedIn={isLoggedIn} miniMode />

      <footer className="mt-10 text-center">
        <p className="text-xs text-muted-foreground">냥점 · 본 결과는 참고용이며 전문 상담을 대체하지 않습니다</p>
      </footer>
    </div>
  );
}
