"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

type ReferralInfo = { code: string; canShare?: boolean; earned: number; available: number };

const SHARE_BUTTON_CLASS =
  "w-full h-14 rounded-full text-sm font-medium transition-opacity hover:opacity-90 inline-flex items-center justify-center gap-2";
const SHARE_BUTTON_STYLE = { background: "#ffd520", color: "#191919" } as const;
const RESULT_BUTTON_STYLE = { background: "#191919", color: "#ffffff" } as const;

/**
 * 결과 페이지·마이페이지용 공유 카드.
 * 친구가 내 링크로 무료 미니 사주를 완료하면 무료권 1개 적립 (친구당 1회, 한도 없음).
 * 결과 페이지(/results/*)에서는 결과지 공유 버튼도 함께 노출된다.
 */
export function ShareRewardCard() {
  const pathname = usePathname();
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

  const isResultPage = pathname?.startsWith("/results/") ?? false;
  const shareUrl = `${window.location.origin}/free?ref=${info.code}`;
  const shareText = "너한테 사주 해설 MINI 선물 도착 🎁 13가지 주제 중 6가지를 무료로 볼 수 있어";
  const resultShareUrl = `${window.location.origin}${pathname}?ref=${info.code}`;

  async function copyToClipboard(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} 링크가 복사됐어요. 카카오톡에 붙여넣어 보내보세요!`);
    } catch {
      toast.error("복사에 실패했어요. 잠시 후 다시 시도해 주세요");
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
    await copyToClipboard(shareUrl, "선물");
  }

  async function shareResult() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "내 사주 결과지", text: "내 사주 결과지 봐봐 👀", url: resultShareUrl });
        return;
      } catch {
        return;
      }
    }
    await copyToClipboard(resultShareUrl, "결과지");
  }

  return (
    <section className="mt-8 space-y-3 px-4 sm:px-0">
      {isResultPage && (
        <button type="button" onClick={shareResult} className={SHARE_BUTTON_CLASS} style={RESULT_BUTTON_STYLE}>
          카카오톡으로 친구에게 &lsquo;내 결과지&rsquo; 공유하기
        </button>
      )}
      <div>
        <button type="button" onClick={share} className={SHARE_BUTTON_CLASS} style={SHARE_BUTTON_STYLE}>
          카카오톡으로 친구에게 &lsquo;무료 해설 MINI&rsquo; 선물하기
        </button>
        <p className="mt-2 text-xs text-center text-ink">
          <span style={{ background: "linear-gradient(transparent 55%, #fde68a 55%)" }}>
            친구가 &lsquo;무료 해설 MINI&rsquo;를 보면 무료 이용권 1개 적립 · 한도 없음
          </span>
        </p>
      </div>
    </section>
  );
}
