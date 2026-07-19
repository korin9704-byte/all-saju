"use client";

// 무료 결과 생성 진행 화면 — 결제 플로우(/checkout/success)와 동일한 로딩 UX
// sessionStorage 의 { kind, payload } 를 읽어 MINI(free-mini) 또는 무료 이용권(redeem) 생성을 수행한다.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAYLOAD_KEY = "saju_generate";

const KINDS = {
  mini: { endpoint: "/api/free-mini", homeHref: "/free" },
  redeem: { endpoint: "/api/orders/redeem", homeHref: "/products" },
} as const;

type Kind = keyof typeof KINDS;

export default function GeneratingPage() {
  const router = useRouter();
  const [pct, setPct] = useState(2);
  const [seconds, setSeconds] = useState(90);
  const [phase, setPhase] = useState<"loading" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [homeHref, setHomeHref] = useState("/");
  const doneRef = useRef(false);
  const startedRef = useRef(false);

  // 진행률·카운트다운 (처음엔 빠르게, 나중엔 느리게 — 90%에서 대기)
  useEffect(() => {
    const timer = setInterval(() => {
      if (doneRef.current) return;
      setSeconds((s) => (s > 0 ? s - 1 : 0));
      setPct((p) => {
        if (p >= 90) return p;
        const inc = p < 30 ? 2 : p < 60 ? 1 : 0.3;
        return Math.min(90, p + inc);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 결과 생성 요청
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let raw: string | null = null;
    try { raw = sessionStorage.getItem(PAYLOAD_KEY); } catch { /* ignore */ }
    if (!raw) {
      router.replace("/");
      return;
    }

    let kind: Kind = "mini";
    let payload: unknown = null;
    try {
      const envelope = JSON.parse(raw) as { kind?: string; payload?: unknown };
      if (envelope.kind === "redeem") kind = "redeem";
      payload = envelope.payload ?? null;
    } catch { /* ignore */ }
    const config = KINDS[kind];
    setHomeHref(config.homeHref);

    if (!payload) {
      router.replace(config.homeHref);
      return;
    }

    fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then((res) => {
        doneRef.current = true;
        if (res.ok && res.data.resultId) {
          try { sessionStorage.removeItem(PAYLOAD_KEY); } catch { /* ignore */ }
          setPct(100);
          setSeconds(0);
          setPhase("done");
          setTimeout(() => router.replace(`/results/${res.data.resultId}`), 600);
        } else {
          setPhase("error");
          setErrorMsg(res.data?.error ?? "결과 생성에 실패했어요");
        }
      })
      .catch(() => {
        doneRef.current = true;
        setPhase("error");
        setErrorMsg("결과 생성 중 오류가 발생했어요");
      });
  }, [router]);

  if (phase === "error") {
    return (
      <div className="container py-16 max-w-md text-center">
        <p className="text-sm font-mono text-mute mb-2">ERROR</p>
        <h1 className="text-xl font-semibold mb-2">결과 생성 실패</h1>
        <p className="text-sm text-body mb-6">{errorMsg}</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            다시 시도하기
          </button>
          <Link href={homeHref} className={cn(buttonVariants({ variant: "outline" }))}>처음으로</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes barPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        #progress-fill { transition: width 1s linear; animation: barPulse 2s ease-in-out infinite; }
      `}</style>

      <div className="container py-16 max-w-sm text-center">
        {/* 메인 메시지 */}
        <h1 className="text-lg font-bold text-ink leading-snug mb-6">
          {phase === "done"
            ? <>분석 완료! 결과 페이지로 이동할게요...🐾</>
            : <>행운의 냥이가 집중해서 분석 중...🐾</>}
        </h1>

        {/* 프로그레스 바 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">🐱</div>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              id="progress-fill"
              className="h-full rounded-full"
              style={{ width: `${pct.toFixed(0)}%`, background: "linear-gradient(90deg, #f59e0b, #f43f5e)" }}
            />
          </div>
          <span className="text-sm font-mono text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
        </div>

        {/* 남은 시간 */}
        <p className="text-sm text-muted-foreground mb-2">
          예상 남은 시간: 약 <span>{seconds}</span>초
        </p>
        <p className="text-xs text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </>
  );
}
