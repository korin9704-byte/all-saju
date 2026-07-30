"use client";

// 결과지 하단 "다른 고민 물어보기" — 클릭 시 위저드 고민 입력 화면(전체 화면)으로 전환.
// 사주 정보는 결과지의 입력값을 재사용하고, 고민만 새로 받아 결제(고민 사주 정가)로 이동한다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";

const MAX_CONCERN = 200;

export type AskSaju = {
  name: string | null;
  birthDate: string;
  birthTime: string | null;
  timeUnknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
};

export function AskAnotherConcern({
  productId,
  price,
  saju,
  guestEmail,
}: {
  productId: string;
  /** 할인 적용가 (followup-question 상품 가격) */
  price: number;
  saju: AskSaju;
  guestEmail?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!concern.trim()) { toast.error("고민을 입력해 주세요."); return; }
    if (submitting) return;
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
          concerns: [concern.trim()],
          guestEmail: guestEmail ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "주문 생성에 실패했어요.");
      router.push(`/checkout/${json.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  }

  if (open) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#F8F4FD" }}>
          <div
            className="w-full max-w-lg px-4 py-10 flex flex-col rounded-2xl overflow-hidden"
            style={{
              minHeight: "88vh",
              backgroundImage:
                "linear-gradient(rgba(248,244,253,0) 42%, rgba(248,244,253,0.8) 60%, rgba(248,244,253,0.97) 72%), url('/images/free-trouble-bg.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          >
            <div className="mt-auto pt-96">
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>어떤 고민이 있으세요?</h1>
              <div className="relative mb-8">
                <textarea value={concern} rows={6}
                  onChange={(e) => setConcern(e.target.value.slice(0, MAX_CONCERN))}
                  placeholder="지금 마음에 걸리는 고민을 자유롭게 작성해 주세요."
                  className="block w-full resize-none rounded-2xl bg-white border border-[#E7DDF8] px-5 py-4 text-sm text-[#4A3A72] leading-relaxed placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors" />
                <p className="absolute bottom-4 right-5 text-xs text-mute">{concern.length}/{MAX_CONCERN}자</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)}
                  className="w-24 h-14 rounded-full bg-white border border-[#E7DDF8] text-[#4A3A72] text-sm font-medium transition-colors hover:bg-[#F3EDFB]">이전</button>
                <button type="button" onClick={submit} disabled={submitting}
                  className="flex-1 h-14 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                  style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}>
                  {submitting ? "잠시만요..." : `${formatKRW(price)} 결제하기 (50% 할인)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8 px-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-14 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}
      >
        또 다른 고민 물어보기 · 50% 할인
      </button>
    </section>
  );
}
