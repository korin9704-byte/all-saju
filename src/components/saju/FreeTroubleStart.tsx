"use client";

// 무료 고민 사주 — 시작하기 버튼 + 단계형 위저드 오버레이
import { useState } from "react";
import { FreeTroubleWizard } from "@/components/saju/FreeTroubleWizard";

export function FreeTroubleStart({
  productId,
  mode = "free",
  askConcern = true,
  basePrice,
  bundle,
}: {
  productId: string;
  mode?: "free" | "paid";
  askConcern?: boolean;
  basePrice?: number;
  bundle?: { productId: string; price: number } | null;
}) {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <FreeTroubleWizard productId={productId} mode={mode} askConcern={askConcern} basePrice={basePrice} bundle={bundle} onBack={() => setStarted(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStarted(true)}
      className="w-full h-14 rounded-full text-white text-sm font-medium tracking-[0.15em] transition-opacity hover:opacity-90"
      style={{ background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}
    >
      시작하기
    </button>
  );
}
