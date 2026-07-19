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
 * 결과 페이지용 공유 카드 — 상품별 MINI 선물 링크(/free/[slug]?ref=) + 결과지 공유.
 * 친구가 내 링크로 MINI를 완료하면 무료 이용권 1개 적립 (친구당 1회, 한도 없음).
 */
export function ShareRewardCard({
  productSlug = "today-fortune",
  productName = "사주 해설",
}: {
  /** 선물할 MINI의 원본 상품 슬러그 */
  productSlug?: string;
  /** 공유 문구에 쓸 원본 상품명 */
  productName?: string;
} = {}) {
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
  const shareUrl = `${window.location.origin}/free/${productSlug}?ref=${info.code}`;
  const resultShareUrl = `${window.location.origin}${pathname}?ref=${info.code}`;

  async function copyToClipboard(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${label} 링크가 복사됐어요. 카카오톡에 붙여넣어 보내보세요!`);
    } catch {
      toast.error("복사에 실패했어요. 잠시 후 다시 시도해 주세요");
    }
  }

  // 1순위: 카카오톡 공유(인앱 브라우저 포함 동작) → 2순위: 기기 공유 시트 → 3순위: 링크 복사
  // 피드형 템플릿: 상품 이미지 + 제목 + 설명 + 버튼 (버튼 미지정 시 카카오가 "자세히 보기"를 강제 표시 — 제거 불가)
  function kakaoShare(title: string, url: string, buttonTitle: string): boolean {
    const kakao = window.Kakao;
    if (!kakao?.isInitialized?.() || !kakao.Share) return false;
    const link = { mobileWebUrl: url, webUrl: url };
    try {
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description: "냥이가 답을 찾아드릴게요!",
          imageUrl: `${window.location.origin}/images/${productSlug}.png`,
          link,
        },
        buttons: [{ title: buttonTitle, link }],
      });
      return true;
    } catch {
      return false;
    }
  }

  async function share() {
    if (kakaoShare(`‘무료 ${productName} MINI’ 선물 도착~`, shareUrl, "무료 MINI 보기")) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: `‘무료 ${productName} MINI’ 선물 도착~ ${shareUrl}` });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등 — 무시
        return;
      }
    }
    await copyToClipboard(shareUrl, "선물");
  }

  async function shareResult() {
    if (kakaoShare(`내 ‘${productName}’ 결과지 봐봐~`, resultShareUrl, "결과지 보기")) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: `내 ‘${productName}’ 결과지 봐봐~ ${resultShareUrl}` });
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
          카카오톡으로 친구에게 &lsquo;무료 버전 MINI&rsquo; 선물하기
        </button>
        <p className="mt-2 text-xs text-center text-ink">
          <span style={{ background: "linear-gradient(transparent 55%, #fde68a 55%)" }}>
            친구가 &lsquo;무료 버전 MINI&rsquo;를 보면 무료 이용권 1개 적립 · 한도 없음
          </span>
        </p>
      </div>
    </section>
  );
}
