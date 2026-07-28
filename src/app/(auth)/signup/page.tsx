"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicEnv } from "@/lib/env";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("가입 완료! 마이페이지로 이동합니다.");
    router.push("/mypage");
    router.refresh();
  }

  return (
    <div className="container py-16 max-w-md">
      <h1 className="text-xl font-bold text-ink mb-4">회원가입</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input id="email" type="email" required placeholder="이메일을 입력해 주세요." value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-full px-6" />
        </div>
        <div>
          <Input id="password" type="password" minLength={8} required placeholder="비밀번호를 입력해 주세요. (8자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-full px-6" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-14 rounded-full" style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}>
          {loading ? "가입 중..." : "가입하기"}
        </Button>
        <div className="flex justify-center gap-2 text-sm text-muted-foreground">
          <span>이미 계정이 있으신가요?</span>
          <Link href="/login" className="hover:text-foreground">로그인</Link>
        </div>
      </form>
    </div>
  );
}
