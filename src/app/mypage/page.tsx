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
        {/* 프로필 아바타 — 똥머리 회색 냥이 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/mypage-avatar.webp"
          alt="프로필 냥이"
          width={88}
          height={88}
          className="h-[88px] w-[88px] rounded-full object-cover"
        />
        <p className="text-sm text-body mt-3">{profile?.email ?? user.email}</p>
      </header>

      <ul>
        <li>
          <Link
            href="/mypage/orders"
            className="flex items-center py-4 text-[15px] font-medium text-ink hover:text-body"
          >
            결제 내역 · 결과지
          </Link>
        </li>
        <li>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center py-4 text-left text-[15px] font-medium text-body hover:text-ink"
            >
              Logout
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}
