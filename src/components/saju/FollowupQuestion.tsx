"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";

const MAX_Q = 100;

export type FollowupSaju = {
  name: string | null;
  birthDate: string;               // YYYY-MM-DD
  birthTime: string | null;        // HH:MM
  timeUnknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
};

/** 결과지 하단 — 추가 질문 결제 섹션 */
export function FollowupQuestion({
  productId,
  price,
  saju,
  guestEmail,
}: {
  productId: string;
  price: number;
  saju: FollowupSaju;
  guestEmail?: string | null;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!question.trim()) { toast.error("궁금한 점을 입력해 주세요."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: saju.name ?? undefined,
          birthDate: saju.birthDate,
          birthTime: saju.timeUnknown ? null : saju.birthTime,
          timeUnknown: saju.timeUnknown,
          gender: saju.gender,
          calendar: saju.calendar,
          concerns: [question.trim()],
          guestEmail: guestEmail ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "주문 생성 실패");
      router.push(`/checkout/${json.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 mb-2 px-4 space-y-3">
      <div className="flex items-center gap-3 pb-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>
      <p className="text-base font-bold text-ink">또 다른 고민이 있으세요?</p>
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_Q))}
          placeholder="지금 마음에 걸리는 고민을 자유롭게 작성해 주세요."
          rows={6}
          className="w-full resize-none rounded-2xl bg-white border border-[#E7DDF8] px-5 py-4 text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors"
        />
        <p className="absolute bottom-4 right-5 text-xs text-mute">{question.length}/{MAX_Q}자</p>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="w-full h-14 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}
      >
        {submitting ? "잠시만요..." : `${formatKRW(price)} 결제하기`}
      </button>
    </div>
  );
}
