"use client";

// 결제 승인 대기 화면 — /generating 과 같은 냥이 별자리 로딩(AnalysisProgress)으로 통일
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnalysisProgress } from "@/components/saju/AnalysisProgress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmProgress({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const [pct, setPct] = useState(2);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  // 진행률: 처음엔 빠르게, 나중엔 느리게 (기존 인라인 스크립트와 동일한 램프)
  useEffect(() => {
    const timer = setInterval(() => {
      setPct((p) => {
        if (p >= 90) return p;
        const inc = p < 30 ? 2 : p < 60 ? 1 : 0.3;
        return Math.min(90, p + inc);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 결제 승인 — 딱 한 번만 호출 (StrictMode 이중 실행 가드)
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/orders/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then((res) => {
        if (res.ok && res.data.resultId) {
          setDone(true);
          setPct(100);
          setTimeout(() => {
            window.location.href = `/results/${res.data.resultId}`;
          }, 600);
        } else {
          setError(res.data.error || "결제 승인에 실패했어요.");
        }
      })
      .catch(() => {
        setError("결제 승인 중 오류가 발생했어요.");
      });
  }, [paymentKey, orderId, amount]);

  if (error) {
    return (
      <div className="container py-16 max-w-md text-center">
        <p className="text-sm font-mono text-mute mb-2">ERROR</p>
        <h1 className="text-xl font-semibold mb-2">결제 처리 실패</h1>
        <p className="text-sm text-body mb-6">{error}</p>
        <Link href="/mypage" className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>마이페이지</Link>
      </div>
    );
  }

  return <AnalysisProgress pct={pct} seconds={0} done={done} />;
}
