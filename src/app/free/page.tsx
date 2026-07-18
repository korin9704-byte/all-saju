import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { FreeMiniForm } from "@/components/saju/FreeMiniForm";

export const metadata = {
  title: "무료 미니 사주",
  description: "생년월일로 3분 만에 보는 무료 미니 사주. 결제 없이 내 사주의 핵심을 확인해 보세요.",
  openGraph: {
    title: "무료 미니 사주가 도착했어요 🎁",
    description: "생년월일만 입력하면 3분 만에 내 사주의 핵심을 무료로 볼 수 있어요.",
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
        <p className="text-xs font-mono text-mute mb-2">FREE MINI SAJU</p>
        <h1 className="text-3xl font-semibold tracking-tight">무료 미니 사주</h1>
        <p className="mt-3 text-sm text-body leading-relaxed">
          생년월일만 입력하면 타고난 기질과 지금 흐름을
          <br />
          3분 만에 무료로 볼 수 있어요
        </p>
      </header>

      <FreeMiniForm isLoggedIn={isLoggedIn} />

      <footer className="mt-10 text-center">
        <p className="text-xs text-muted-foreground">냥점 · 본 결과는 참고용이며 전문 상담을 대체하지 않습니다</p>
      </footer>
    </div>
  );
}
