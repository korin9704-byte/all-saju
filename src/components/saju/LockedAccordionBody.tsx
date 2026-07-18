"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";

type Section = { title: string; content: string };

function parseSections(markdown: string): Section[] {
  const parts = markdown.split(/\n(?=## )/);
  const sections: Section[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("## ")) continue;
    const newlineIdx = trimmed.indexOf("\n");
    if (newlineIdx === -1) continue;
    const title = trimmed.slice(3, newlineIdx).trim();
    const content = trimmed.slice(newlineIdx + 1).trim();
    if (title && content) sections.push({ title, content });
  }
  return sections;
}

/**
 * MINI 잠금 결과지: 앞 visibleCount개는 열람 가능, 나머지는 제목만 보이는 잠금 상태.
 * 언락 버튼 → 990원 결제 주문 생성 → 체크아웃 → 결제 완료 시 전체 공개.
 */
export function LockedAccordionBody({
  markdown,
  resultId,
  unlockPrice,
  visibleCount = 6,
  headerTitle = "사주 해설",
}: {
  markdown: string;
  resultId: string;
  unlockPrice: number;
  visibleCount?: number;
  headerTitle?: string;
}) {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const allSections = parseSections(markdown);
  const visible = allSections.slice(0, visibleCount);
  const locked = allSections.slice(visibleCount);

  async function startUnlock() {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const res = await fetch("/api/orders/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });
      const json = await res.json();
      if (res.status === 401) {
        router.push(`/login?redirect=/results/${resultId}`);
        return;
      }
      if (res.status === 409 && json.resultId) {
        // 이미 열린 결과 — 새로고침
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "주문 생성 실패");
      router.push(`/checkout/${json.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했어요");
      setUnlocking(false);
    }
  }

  if (allSections.length === 0) {
    return <p className="text-sm text-muted-foreground">{markdown}</p>;
  }

  return (
    <>
    <div className="divide-y divide-border">
      {/* 헤더 */}
      <div className="px-5 py-4 text-center" style={{ background: "#1a1a1a" }}>
        <p className="text-sm font-semibold tracking-widest text-white">{headerTitle}</p>
        <p className="mt-1 text-xs text-white/50">
          {visible.length}개 주제는 무료로 볼 수 있어요 · 잠긴 {locked.length}개는 결제 후 공개돼요
        </p>
      </div>

      {/* 열람 가능 주제 */}
      <ul className="divide-y divide-border">
        {visible.map((sec, i) => {
          const isOpen = openIdx === i;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors"
              >
                <span className="flex-1 text-sm font-medium text-ink leading-relaxed">
                  {sec.title}
                </span>
                <svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <circle cx="10" cy="10" r="9" fill={isOpen ? "#000" : "#f0f0f0"} />
                  <path
                    d="M6.5 8.5 L10 12 L13.5 8.5"
                    stroke={isOpen ? "#fff" : "#999"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {isOpen && (
                <div className="px-5 pb-6 pt-1 bg-[#fafafa] border-t border-border">
                  {sec.content.split("\n\n").map((para, pi) => (
                    <p key={pi} className="text-sm text-[#3a3a3a] leading-[1.95] mb-4 last:mb-0">
                      {para.replace(/^[-•]\s?/, "")}
                    </p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* 잠긴 주제 (제목만 노출) */}
      <ul className="divide-y divide-border">
        {locked.map((sec, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={startUnlock}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors"
            >
              <span className="flex-1 text-sm font-medium text-ink/40 leading-relaxed">
                {sec.title}
              </span>
              <span className="shrink-0 text-base" aria-label="잠김">🔒</span>
            </button>
          </li>
        ))}
      </ul>
    </div>

    {/* 언락 카드 — 공유 카드와 동일한 스타일, 주제 목록 아래 배치 */}
    <section className="mt-8 rounded-2xl border-2 border-ink overflow-hidden">
      <div className="px-6 py-5" style={{ background: "#000" }}>
        <p className="text-base font-bold text-white">아직 {locked.length}개 주제가 잠겨 있어요 🔒</p>
        <p className="mt-1 text-xs" style={{ color: "#bbb" }}>
          재물운·연애운·건강운까지, <b className="text-white">나머지 해설 전부</b>를 확인해 보세요
        </p>
      </div>
      <div className="px-6 py-5 bg-canvas">
        <button
          type="button"
          onClick={startUnlock}
          disabled={unlocking}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "#FEE500", color: "#191919" }}
        >
          {unlocking ? "결제 페이지로 이동 중..." : `${formatKRW(unlockPrice)}으로 전체 해설 열기`}
        </button>
      </div>
    </section>
    </>
  );
}
