"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type ReferralInfo = { code: string; canShare?: boolean; earned: number; available: number };

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
    <section className="mt-8">
      <button
        type="button"
        onClick={share}
        className="w-full h-14 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 border-2 border-ink inline-flex items-center justify-center gap-2"
        style={{ background: "#FEE500", color: "#191919" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M12 3C6.48 3 2 6.36 2 10.5c0 2.64 1.74 4.96 4.36 6.3l-.9 3.32c-.08.3.26.54.52.37l3.98-2.64c.66.09 1.34.15 2.04.15 5.52 0 10-3.36 10-7.5S17.52 3 12 3Z"
            fill="#191919"
          />
        </svg>
        카카오톡으로 친구에게 &lsquo;무료 사주 해설 MINI&rsquo; 선물하기
      </button>
      <p className="mt-2 text-xs text-center text-mute">
        친구가 &lsquo;무료 사주 해설 MINI&rsquo;를 보면 나에게 무료 이용권 1개가 쌓여요 · 한도 없음
      </p>
    </section>
  );
}
