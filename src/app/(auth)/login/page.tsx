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
      <h1 className="text-xl font-bold text-ink mb-4">로그인</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input id="email" type="email" required placeholder="이메일을 입력해 주세요." value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-full px-6" />
            </div>
            <div>
              <Input id="password" type="password" required placeholder="비밀번호를 입력해 주세요." value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-full px-6" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full" style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
            <div className="flex justify-center gap-2 text-sm text-muted-foreground">
              <Link href="/signup" className="hover:text-foreground">회원가입</Link>
              <span>·</span>
              <Link href="/reset" className="hover:text-foreground">비밀번호 재설정</Link>
            </div>
          </form>
    </div>
  );
}
