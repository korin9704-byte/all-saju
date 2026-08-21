"use client";

// 무료 고민 사주 — 시작하기 버튼 + 단계형 위저드 오버레이
import { useState } from "react";
import { FreeTroubleWizard } from "@/components/saju/FreeTroubleWizard";

export function FreeTroubleStart({
  productId,
  mode = "free",
  askConcern = true,
  askJob = false,
  basePrice,
  bundle,
}: {
  productId: string;
  mode?: "free" | "paid";
  askConcern?: boolean;
  askJob?: boolean;
  basePrice?: number;
  bundle?: { productId: string; price: number } | null;
}) {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <FreeTroubleWizard productId={productId} mode={mode} askConcern={askConcern} askJob={askJob} basePrice={basePrice} bundle={bundle} onBack={() => setStarted(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStarted(true)}
      className="w-full h-12 rounded-full bg-[#E7DDF8] text-ink text-[14px] font-medium transition-colors hover:bg-[#DCD2F5]"
    >
      고민 오늘 끝내기!!
    </button>
  );
}
