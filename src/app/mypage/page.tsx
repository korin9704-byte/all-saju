import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "마이페이지" };

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/mypage");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="container py-12 max-w-2xl">
      <header className="mb-10">
        {/* 프로필 아바타 — 파스텔 원 + 손그림 고양이 + 반짝이 */}
        {/* SVG 내부 여백(원 왼쪽 가장자리 x=10) 때문에 -10px 당겨 이메일 텍스트와 왼쪽 라인 맞춤 */}
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="프로필 냥이" style={{ marginLeft: -10 }}>
          <circle cx="44" cy="44" r="34" fill="#F6DDF0" />
          {/* 귀 */}
          <path d="M28 34 L23 16 L38 26 Z" fill="#fff" stroke="#221F1F" strokeWidth="4" strokeLinejoin="round" />
          <path d="M60 34 L65 16 L50 26 Z" fill="#fff" stroke="#221F1F" strokeWidth="4" strokeLinejoin="round" />
          {/* 얼굴 */}
          <ellipse cx="44" cy="44" rx="23" ry="19" fill="#fff" stroke="#221F1F" strokeWidth="4" />
          {/* 눈 */}
          <circle cx="36" cy="42" r="2.4" fill="#221F1F" />
          <circle cx="52" cy="42" r="2.4" fill="#221F1F" />
          {/* 코·입 */}
          <path d="M44 46 L44 50 M40 52 Q44 55 48 52" stroke="#221F1F" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          {/* 수염 */}
          <path d="M20 44 L28 45 M21 51 L29 50 M68 44 L60 45 M67 51 L59 50" stroke="#221F1F" strokeWidth="2.4" strokeLinecap="round" />
          {/* 반짝이 */}
          <path d="M15 16 L18 24 L26 27 L18 30 L15 38 L12 30 L4 27 L12 24 Z" fill="#221F1F" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M73 54 L75.5 60 L81.5 62.5 L75.5 65 L73 71 L70.5 65 L64.5 62.5 L70.5 60 Z" fill="#221F1F" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-body mt-3">{profile?.email ?? user.email}</p>
      </header>

      <ul>
        <li>
          <Link
            href="/mypage/orders"
            className="flex items-center gap-3 py-4 text-[15px] font-medium text-ink hover:text-body"
          >
            {/* 영수증 아이콘 */}
            <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 2.5 H15 V17 L12.5 15.5 L10 17 L7.5 15.5 L5 17 Z" stroke="#C95FC0" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M7.5 7 H12.5 M7.5 10.5 H12.5" stroke="#C95FC0" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span>결제 내역 · 결과지</span>
          </Link>
        </li>
        <li>
          <Link
            href="/mypage/reviews"
            className="flex items-center gap-3 py-4 text-[15px] font-medium text-ink hover:text-body"
          >
            {/* 별 아이콘 */}
            <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 2.8 L12.2 7.4 L17.2 8 L13.5 11.4 L14.5 16.4 L10 13.9 L5.5 16.4 L6.5 11.4 L2.8 8 L7.8 7.4 Z" stroke="#C95FC0" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            <span>내 리뷰</span>
          </Link>
        </li>
        <li>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 py-4 text-[15px] font-medium text-body hover:text-ink"
            >
              {/* 나가기 아이콘 */}
              <svg className="shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M12.5 6.5 V4 H4 V16 H12.5 V13.5 M8 10 H17 M17 10 L14 7 M17 10 L14 13" stroke="#C95FC0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Logout</span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
