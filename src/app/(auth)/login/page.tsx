"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") ?? "/mypage";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("로그인되었습니다");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="container py-16 max-w-md">
      <h1 className="text-xl font-bold text-ink mb-8">로그인</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일·비밀번호 한 줄 배치 */}
            <div className="grid grid-cols-2 gap-3">
              <Input id="email" type="email" placeholder="이메일" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input id="password" type="password" placeholder="비밀번호" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full" style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
            <div className="flex justify-between text-sm">
              <Link href="/signup" className="text-muted-foreground hover:text-foreground">회원가입</Link>
              <Link href="/reset" className="text-muted-foreground hover:text-foreground">비밀번호 재설정</Link>
            </div>
          </form>
    </div>
  );
}
