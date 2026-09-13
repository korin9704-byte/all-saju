"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

// 결제완료인데 결과지가 없는 주문의 복구 버튼 — 재생성 + 고객 이메일 재발송
export function RegenerateButton({ orderRowId, orderLabel }: { orderRowId: string; orderLabel: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function regenerate() {
    if (!window.confirm(`${orderLabel}\n\n결과지를 재생성할까요?\n완료되면 고객에게 결과지 이메일이 발송됩니다.\n(인생 사주 포함 시 몇 분 걸릴 수 있어요)`)) return;
    setWorking(true);
    try {
      const res = await fetch("/api/admin/orders/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRowId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "재생성에 실패했습니다.");
      alert("재생성 완료 — 고객에게 이메일이 발송됐습니다.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "재생성에 실패했습니다.");
      setWorking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={regenerate}
      disabled={working}
      className="inline-flex h-7 items-center justify-center rounded-full border border-[#C95FC0] px-3 text-xs text-[#C95FC0] transition-colors hover:bg-[#FBEFF7] disabled:opacity-50 disabled:pointer-events-none"
    >
      {working ? <Spinner size={14} /> : "재생성"}
    </button>
  );
}
