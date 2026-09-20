"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  orderId: string;
  /** 상품명 — 헤더에서 표시하므로 폼에서는 현재 미사용 */
  productName?: string;
};

export function ReviewForm({ orderId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 5) {
      toast.error("후기는 5자 이상 작성해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, content: content.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "후기 저장 실패");
      toast.success("후기가 등록되었습니다.");
      router.push("/mypage/reviews");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 별점 — 왼쪽 정렬 큰 별 */}
      <div className="flex justify-start gap-1 mb-5 -ml-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n}점`}
            className="w-10 h-10 flex items-center justify-center text-[28px] leading-none"
          >
            <span className={n <= rating ? "text-[#C95FC0]" : "text-[#E3D8F4]"}>★</span>
          </button>
        ))}
      </div>

      <textarea
        id="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        maxLength={2000}
        placeholder="사주가 어떠셨나요? 솔직한 후기를 남겨 주세요."
        className="block w-full resize-none rounded-[22px] bg-white border border-[#E7DDF8] px-5 py-4 text-sm text-[#4A3A72] leading-relaxed placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors"
      />
      <p className="text-[11.5px] text-mute text-right mt-1.5 mb-5 pr-1">{content.length} / 2000</p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-full bg-[#E7DDF8] text-ink text-[14px] font-medium transition-colors hover:bg-[#DCD2F5] disabled:opacity-50"
      >
        {submitting ? "등록 중..." : "후기 등록하기!!"}
      </button>
    </form>
  );
}
