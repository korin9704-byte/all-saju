"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type ReferralInfo = { code: string; canShare?: boolean; earned: number; available: number; cap: number };

/**
 * 결과 페이지·마이페이지용 공유 카드.
 * 친구가 내 링크로 무료 미니 사주를 완료하면 무료권 1개 적립 (친구당 1회, 누적 상한).
 */
export function ShareRewardCard() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch("/api/referral/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.code) setInfo(json);
        else setHidden(true); // 미로그인 등 — 카드 숨김
      })
      .catch(() => setHidden(true));
  }, []);

  // 풀버전(유료) 열람자만 공유 링크 획득 — MINI만 본 사람에게는 노출하지 않음
  if (hidden || !info || info.canShare === false) return null;

  const shareUrl = `${window.location.origin}/free?ref=${info.code}`;
  const shareText = "너한테 사주 해설 MINI 선물 도착 🎁 13가지 주제 중 6가지를 무료로 볼 수 있어";
  const capped = info.earned >= info.cap;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크가 복사됐어요. 카카오톡에 붙여넣어 보내보세요!");
    } catch {
      toast.error("복사에 실패했어요. 링크를 직접 선택해 주세요");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "무료 미니 사주", text: shareText, url: shareUrl });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등 — 무시
        return;
      }
    }
    await copyLink();
  }

  return (
    <section className="mt-8 rounded-2xl border-2 border-ink overflow-hidden">
      <div className="px-6 py-5" style={{ background: "#000" }}>
        <p className="text-base font-bold text-white">친구에게 사주 해설 MINI 선물하기 🎁</p>
        <p className="mt-1 text-xs" style={{ color: "#bbb" }}>
          친구가 내 링크로 MINI를 보면, 나에게 <b className="text-white">상품 무료권 1개</b>가 쌓여요
        </p>
      </div>
      <div className="px-6 py-5 space-y-4 bg-canvas">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-xl bg-[#f5f5f5] px-4 py-2.5 text-xs text-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 rounded-xl border-2 border-ink px-4 py-2.5 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition-colors"
          >
            복사
          </button>
        </div>
        <button
          type="button"
          onClick={share}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#FEE500", color: "#191919" }}
        >
          카카오톡으로 보내기
        </button>
        <div className="flex items-center justify-between text-xs text-mute">
          <span>
            적립 {info.earned}/{info.cap}
            {capped && " · 상한 도달"}
          </span>
          <span>
            사용 가능 무료권 <b className="text-ink">{info.available}개</b>
          </span>
        </div>
      </div>
    </section>
  );
}
