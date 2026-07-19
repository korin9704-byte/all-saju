"use client";

// 카카오 로그인 복귀 전용 페이지 — 저장해둔 입력으로 주문 생성/무료 결과를 이어서 진행한다.
// 문구만 보이는 전환 화면이며, 완료되면 결제 페이지 또는 결과 생성 화면으로 이동한다.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RESUME_KEY = "saju_resume";

export default function ResumePage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [backHref, setBackHref] = useState("/products");

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
            sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "mini", payload: { ...(payload as object), ref } }));
            sessionStorage.removeItem(RESUME_KEY);
          } catch { /* ignore */ }
          router.replace("/generating");
          return;
        }

        // 결제 경로: 이용권이 있으면 결제 대신 무료로 결과 생성
        let redeem = false;
        try {
          const res = await fetch("/api/referral/me");
          const json = res.ok ? await res.json() : null;
          redeem = (json?.available ?? 0) > 0;
        } catch { /* 조회 실패 시 결제 경로 */ }

        if (redeem) {
          try {
            sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "redeem", payload }));
            sessionStorage.removeItem(RESUME_KEY);
          } catch { /* ignore */ }
          router.replace("/generating");
          return;
        }

        const res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "주문 생성 실패");
        try { sessionStorage.removeItem(RESUME_KEY); } catch { /* ignore */ }
        router.replace(`/checkout/${json.orderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "진행 중 오류가 발생했어요");
      }
    })();
  }, [router]);

  if (error) {
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

  return (
    <div className="container py-24 max-w-md text-center">
      <p className="text-lg font-bold text-ink">😽 로그인 완료!</p>
      <p className="mt-2 text-sm text-mute">잠시만요, 이어서 진행하고 있어요...</p>
    </div>
  );
}
