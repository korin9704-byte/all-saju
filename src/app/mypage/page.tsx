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
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile?.display_name ?? "🐱"}
        </h1>
        <p className="text-sm text-body mt-1">{profile?.email ?? user.email}</p>
      </header>

      <ul className="divide-y divide-hairline border-y border-hairline">
        <li>
          <Link
            href="/mypage/orders"
            className="flex items-center justify-between py-4 text-[15px] font-medium text-ink hover:text-body"
          >
            <span>결제 내역 / 결과지</span>
          </Link>
        </li>
        <li>
          <Link
            href="/mypage/reviews"
            className="flex items-center justify-between py-4 text-[15px] font-medium text-ink hover:text-body"
          >
            <span>내 리뷰</span>
          </Link>
        </li>
        <li>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center justify-between py-4 text-[15px] font-medium text-body hover:text-ink"
            >
              <span>로그아웃</span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
