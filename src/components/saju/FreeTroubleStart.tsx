"use client";

// 무료 고민 사주 — 시작하기 버튼 + 단계형 위저드 오버레이
import { useState } from "react";
import { FreeTroubleWizard } from "@/components/saju/FreeTroubleWizard";

export function FreeTroubleStart({ productId }: { productId: string }) {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <FreeTroubleWizard productId={productId} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStarted(true)}
      className="w-full h-14 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
      style={{ backgroundColor: "#7c4698" }}
    >
      시작하기
    </button>
  );
}
