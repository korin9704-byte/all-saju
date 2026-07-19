"use client";

// 카카오 로그인 복귀 전용 페이지 — 저장해둔 입력으로 주문 생성/무료 결과를 이어서 진행한다.
// 무료 이용권이 있으면 자동 사용하지 않고 사용 여부를 먼저 묻는다.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RESUME_KEY = "saju_resume";

export default function ResumePage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const payloadRef = useRef<unknown>(null);
  const [phase, setPhase] = useState<"loading" | "choice" | "error">("loading");
  const [credits, setCredits] = useState(0);
  const [choosing, setChoosing] = useState(false);
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
    payloadRef.current = payload;
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

        // 결제 경로: 이용권이 있으면 자동 사용하지 않고 사용 여부를 먼저 묻는다
        let available = 0;
        try {
          const res = await fetch("/api/referral/me");
          const json = res.ok ? await res.json() : null;
          available = json?.available ?? 0;
        } catch { /* 조회 실패 시 결제 경로 */ }

        if (available > 0) {
          setCredits(available);
          setPhase("choice");
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

  async function chooseRedeem() {
    if (choosing) return;
    setChoosing(true);
    try {
      sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "redeem", payload: payloadRef.current }));
      sessionStorage.removeItem(RESUME_KEY);
    } catch { /* ignore */ }
    router.replace("/generating");
  }

  async function choosePay() {
    if (choosing) return;
    setChoosing(true);
    try {
      await createOrderAndCheckout(payloadRef.current);
    } catch (err) {
      setChoosing(false);
      setError(err instanceof Error ? err.message : "진행 중 오류가 발생했어요");
      setPhase("error");
    }
  }

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

  if (phase === "choice") {
    return (
      <div className="container py-24 max-w-md text-center">
        <p className="text-lg font-bold text-ink">😽 로그인 완료!</p>
        <p className="mt-2 text-sm text-body">
          무료 이용권이 <b>{credits}개</b> 있어요. 사용해서 결제 없이 결과를 볼까요?
        </p>
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={chooseRedeem}
            disabled={choosing}
            className="w-full h-14 rounded-full bg-ink text-white text-sm font-medium transition-colors hover:bg-ink/80 disabled:opacity-50"
          >
            {choosing ? "잠시만요..." : "무료 이용권 1개 사용하기"}
          </button>
          <button
            type="button"
            onClick={choosePay}
            disabled={choosing}
            className="w-full h-14 rounded-full border-2 border-ink text-ink text-sm font-medium transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
          >
            {choosing ? "잠시만요..." : "990원 결제하기"}
          </button>
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
