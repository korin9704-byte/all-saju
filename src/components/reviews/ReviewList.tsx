"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type Review = { id: string; rating: number; content: string; created_at: string; product_name?: string };

export function ReviewList({ reviews, title = "리뷰", initialCount = 3 }: { reviews: Review[]; title?: string; initialCount?: number }) {
  const INITIAL_COUNT = initialCount;
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const displayed = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <section className="mb-10 pt-2">
      {title && (
        <div className="mb-4 flex items-center gap-2.5">
          <h2 className="text-[14.5px] font-semibold text-ink">{title}</h2>
          {/* 별점 평균 · 리뷰 개수 */}
          {reviews.length > 0 && (
            <span className="flex items-center gap-1.5 text-[14.5px] text-body">
              <span className="text-[#C95FC0]">★</span>
              <span className="font-semibold text-ink">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
              <span>·</span>
              <span>{reviews.length.toLocaleString()}개</span>
            </span>
          )}
        </div>
      )}
      {/* 결과지 묘묘 말풍선 스타일 — 별점·날짜 위, 꼬리 달린 연보라 버블 */}
      <ul className="space-y-[18px]">
        {displayed.map((r) => (
          <li key={r.id}>
            <div className="flex items-center justify-between px-1 pb-1.5">
              <span aria-label={`${r.rating}점`} className="text-[13px] tracking-[1px]">
                <span className="text-[#C95FC0]">{"★".repeat(r.rating)}</span>
                <span className="text-[#D8CCEE]">{"★".repeat(5 - r.rating)}</span>
              </span>
              {/* 상품명 — 전체 리뷰 페이지처럼 여러 상품이 섞일 때 구분용 */}
              <span className="text-xs text-mute">
                {r.product_name && <>{r.product_name} · </>}
                {formatDate(r.created_at)}
              </span>
            </div>
            <div className="relative w-fit max-w-full rounded-2xl bg-[#EDE6F9] px-4 py-3">
              <span
                className="absolute -left-1.5 bottom-0.5 w-3.5 h-3.5 bg-[#EDE6F9] rounded-br-[14px]"
                style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
                aria-hidden
              />
              <p className="text-[14.5px] text-charcoal leading-[1.85]">{r.content}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F3EDFB] border border-[#E7DDF8] text-[14.5px] text-body hover:bg-[#E7DDF8] transition-colors"
          >
            <span>더 보기 ({reviews.length - visibleCount}개 남음)</span>
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
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F3EDFB] border border-[#E7DDF8] text-[14.5px] text-body hover:bg-[#E7DDF8] transition-colors"
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
