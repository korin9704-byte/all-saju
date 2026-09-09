"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

// 관리자 결제 내역 행의 환불 버튼 — 확인 후 토스 취소 + 주문 refunded 처리
export function RefundButton({ orderRowId, orderLabel }: { orderRowId: string; orderLabel: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function refund() {
    if (!window.confirm(`${orderLabel}\n\n이 주문을 환불 처리할까요?\n토스 결제가 취소되고 결과지 열람이 차단됩니다.`)) return;
    setWorking(true);
    try {
      const res = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRowId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "환불 처리에 실패했습니다.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "환불 처리에 실패했습니다.");
      setWorking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={refund}
      disabled={working}
      className="inline-flex h-7 items-center justify-center rounded-full border border-hairline px-3 text-xs text-ink transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-50 disabled:pointer-events-none"
    >
      {working ? <Spinner size={14} /> : "환불"}
    </button>
  );
}
