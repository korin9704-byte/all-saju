"use client";

import { useState } from "react";

type Review = { id: string; rating: number; content: string; created_at: string; product_name?: string };

export function ReviewList({ reviews, title = "리뷰", initialCount = 3 }: { reviews: Review[]; title?: string; initialCount?: number }) {
  const INITIAL_COUNT = initialCount;
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const displayed = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;
  // 페이드형 더 보기 — 다음 리뷰를 살짝 보여주고 그라데이션으로 가림
  const teaser = hasMore ? reviews[visibleCount] : null;

  return (
    <section className="mb-10 pt-2">
      {title && (
        // 결과지 마름모 구분선 모티프의 포인트 헤더
        <div className="mb-4 flex items-center gap-2 pl-2">
          <span className="w-[7px] h-[7px] bg-[#8F7BD6] rotate-45 rounded-[1.5px]" aria-hidden />
          <h2 className="text-[14.5px] font-normal text-ink">{title}</h2>
        </div>
      )}
      {/* 결과지 묘묘 말풍선 스타일 — 별점·날짜 위, 꼬리 달린 연보라 버블 */}
      <ul className="space-y-[18px]">
        {displayed.map((r) => (
          <li key={r.id}>
            <div className="relative w-fit max-w-full rounded-2xl bg-[#EDE6F9] px-4 py-3">
              <span
                className="absolute -left-1.5 bottom-0.5 w-3.5 h-3.5 bg-[#EDE6F9] rounded-br-[14px]"
                style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
                aria-hidden
              />
              <p className="text-[14.5px] text-charcoal leading-[1.85]">{r.content}</p>
            </div>
            {/* 상품명 — 전체 리뷰 페이지처럼 여러 상품이 섞일 때 구분용 */}
            {r.product_name && (
              <div className="px-1 pt-1.5 text-xs text-mute">{r.product_name}</div>
            )}
          </li>
        ))}
      </ul>

      {teaser && (
        <div className="relative mt-[18px]">
          {/* 잘려 보이는 다음 리뷰 */}
          <div className="max-h-[110px] overflow-hidden" aria-hidden>
            <div className="relative w-fit max-w-full rounded-2xl bg-[#EDE6F9] px-4 py-3">
              <p className="text-[14.5px] text-charcoal leading-[1.85]">{teaser.content}</p>
            </div>
          </div>
          {/* 페이드 + 떠 있는 더 보기 버튼 */}
          <div
            className="absolute inset-0 flex items-end justify-center pb-0.5"
            style={{ background: "linear-gradient(180deg, rgba(248,244,253,0), #F8F4FD 78%)" }}
          >
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="flex items-center gap-1.5 rounded-full bg-white border border-[#E7DDF8] px-5 py-2.5 text-[14.5px] text-body shadow-[0_4px_14px_rgba(143,123,214,0.18)] hover:bg-[#F3EDFB] transition-colors"
            >
              <span>더 보기 ({reviews.length - visibleCount}개 남음)</span>
              <span className="text-[11px] text-mute" aria-hidden>▼</span>
            </button>
          </div>
        </div>
      )}
      {visibleCount > INITIAL_COUNT && (
        <div className={`flex justify-center ${teaser ? "mt-3" : "mt-5"}`}>
          <button
            type="button"
            onClick={() => setVisibleCount(INITIAL_COUNT)}
            className="flex items-center gap-1.5 rounded-full bg-white border border-[#E7DDF8] px-5 py-2.5 text-[14.5px] text-body shadow-[0_4px_14px_rgba(143,123,214,0.18)] hover:bg-[#F3EDFB] transition-colors"
          >
            <span>접기</span>
            <span className="text-[11px] text-mute" aria-hidden>▲</span>
          </button>
        </div>
      )}
    </section>
  );
}
