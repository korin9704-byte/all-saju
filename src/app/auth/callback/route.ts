import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/mypage";

  const supabase = await createClient();

  // 비밀번호 재설정 (recovery) 처리
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/update-password`);
    }
    return NextResponse.redirect(`${origin}/reset?error=expired`);
  }

  // 일반 OAuth / 이메일 확인 처리
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 비밀번호 재설정 flow는 새 비밀번호 입력 페이지로
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
