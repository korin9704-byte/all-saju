"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("비밀번호 재설정 이메일을 보냈습니다.");
  }

  return (
    <div className="container py-16 max-w-md">
      <h1 className="text-xl font-bold text-ink mb-4">비밀번호 재설정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input id="email" type="email" required placeholder="이메일을 입력해 주세요." value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-full px-6" />
        </div>
        <Button type="submit" disabled={loading} className="w-full h-14 rounded-full" style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}>
          {loading ? "발송 중..." : "재설정 링크 받기"}
        </Button>
      </form>
    </div>
  );
}
