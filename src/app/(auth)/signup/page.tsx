"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <h1 className="text-xl font-bold text-ink mb-8">회원가입</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (8자 이상)</Label>
              <Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full" style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}>
              {loading ? "가입 중..." : "가입하기"}
            </Button>
            <p className="text-sm text-center">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary hover:underline">로그인</Link>
            </p>
          </form>
    </div>
  );
}
