"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type Review = { id: string; rating: number; content: string; created_at: string };

export function ReviewList({ reviews, title = "이용 후기", initialCount = 3 }: { reviews: Review[]; title?: string; initialCount?: number }) {
  const INITIAL_COUNT = initialCount;
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const displayed = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <section className="mb-10 pt-2">
      {title && <h2 className="text-sm font-semibold mb-4 text-ink">{title}</h2>}
      <ul className="space-y-3">
        {displayed.map((r) => (
          <li key={r.id} className="bg-[#f5f5f5] rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span aria-label={`${r.rating}점`}>
                <span className="text-[#f59e0b]">{"★".repeat(r.rating)}</span>
                <span className="text-[#e0e0e0]">{"★".repeat(5 - r.rating)}</span>
              </span>
              <span className="text-xs text-mute font-mono">{formatDate(r.created_at)}</span>
            </div>
            <p className="text-sm text-charcoal leading-relaxed">{r.content}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#f5f5f5] text-sm text-body hover:bg-[#ebebeb] transition-colors"
          >
            <span>후기 더 보기 ({reviews.length - visibleCount}개 남음)</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" fill="#d0d0d0" />
              <path d="M6.5 8.5 L10 12 L13.5 8.5" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {visibleCount > INITIAL_COUNT && (
          <button
            type="button"
            onClick={() => setVisibleCount(INITIAL_COUNT)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#f5f5f5] text-sm text-body hover:bg-[#ebebeb] transition-colors"
          >
            <span>접기</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" fill="#d0d0d0" />
              <path d="M6.5 12 L10 8.5 L13.5 12" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
