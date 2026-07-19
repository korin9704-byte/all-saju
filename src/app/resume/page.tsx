"use client";

// 카카오 로그인 복귀 전용 페이지 — 저장해둔 입력으로 주문 생성/무료 결과를 이어서 진행한다.
// 무료 이용권이 있으면 바로 사용해서 분석 페이지로 넘어간다.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnalysisProgress } from "@/components/saju/AnalysisProgress";

const RESUME_KEY = "saju_resume";

export default function ResumePage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [backHref, setBackHref] = useState("/products");

  async function createOrderAndCheckout(payload: unknown) {
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "주문 생성 실패");
    try { sessionStorage.removeItem(RESUME_KEY); } catch { /* ignore */ }
    router.replace(`/checkout/${json.orderId}`);
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let raw: string | null = null;
    try { raw = sessionStorage.getItem(RESUME_KEY); } catch { /* ignore */ }
    if (!raw) {
      router.replace("/");
      return;
    }

    let envelope: { mode?: string; productSlug?: string; payload?: unknown } = {};
    try { envelope = JSON.parse(raw); } catch { /* ignore */ }
    const { mode, productSlug, payload } = envelope;
    if (!payload) {
      router.replace("/");
      return;
    }
    setBackHref(mode === "mini" ? "/free" : productSlug ? `/products/${productSlug}` : "/products");

    void (async () => {
      try {
        if (mode === "mini") {
          let ref: string | undefined;
          try { ref = localStorage.getItem("saju_ref") ?? undefined; } catch { /* ignore */ }
          try {
            sessionStorage.setItem(
              "saju_generate",
              JSON.stringify({ kind: "mini", payload: { ...(payload as object), productSlug, ref } }),
            );
            sessionStorage.removeItem(RESUME_KEY);
          } catch { /* ignore */ }
          router.replace("/generating");
          return;
        }

        // 결제 경로: 이용권이 있으면 바로 사용해서 결과 생성으로 진행
        let available = 0;
        try {
          const res = await fetch("/api/referral/me");
          const json = res.ok ? await res.json() : null;
          available = json?.available ?? 0;
        } catch { /* 조회 실패 시 결제 경로 */ }

        if (available > 0) {
          try {
            sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "redeem", payload }));
            sessionStorage.removeItem(RESUME_KEY);
          } catch { /* ignore */ }
          router.replace("/generating");
          return;
        }

        await createOrderAndCheckout(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "진행 중 오류가 발생했어요");
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (phase === "error") {
    return (
      <div className="container py-24 max-w-md text-center">
        <p className="text-sm font-mono text-mute mb-2">ERROR</p>
        <h1 className="text-xl font-semibold mb-2">진행 실패</h1>
        <p className="text-sm text-body mb-6">{error}</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            다시 시도하기
          </button>
          <Link href={backHref} className={cn(buttonVariants({ variant: "outline" }))}>처음으로</Link>
        </div>
      </div>
    );
  }

  // 분기하는 동안 분석 중 화면을 0% 고정으로 보여준다 (이후 /generating 또는 결제 페이지로 전환)
  return <AnalysisProgress pct={0} seconds={90} />;
}
