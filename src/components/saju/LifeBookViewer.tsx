"use client";

// =====================================================
// 인생 사주 — 모바일 챕터 뷰어 (13장 평생 리포트)
// =====================================================
// 샘플 뷰어(public/sample-mobile.html)를 React 로 이식.
// 서버에서 조립된 views(HTML)를 장 단위로 넘기며 읽는다.
// 표지 없이 1장부터 바로 시작한다 (과거 payload 의 표지 뷰는 걸러냄).

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { LifeReportPayload } from "@/lib/saju/life-report";
import { LIFEBOOK_CSS } from "./lifebook-css";
import { HeaderMenu } from "@/components/HeaderMenu";
import { AskAnotherConcern, type AskSaju } from "@/components/saju/AskAnotherConcern";
import { AskReunionFollowup } from "@/components/saju/AskReunionFollowup";

/** "1장" → "01." (장 표기 없이 번호만) */
function fmtLabel(label: string): string {
  const m = label.match(/^(\d+)\s*장$/);
  return m ? `${m[1].padStart(2, "0")}.` : label;
}

export default function LifeBookViewer({
  payload,
  storageKey,
  siblingTab,
  currentTabLabel = "인생 사주",
  isLoggedIn = false,
  ask,
  share,
}: {
  payload: LifeReportPayload;
  storageKey: string;
  /** 번들 형제 결과지로 이동하는 탭 */
  siblingTab?: { label: string; href: string };
  /** 현재 결과지 탭 라벨 (기본: 인생 사주) */
  currentTabLabel?: string;
  /** 헤더 메뉴(발바닥) 로그인 상태 */
  isLoggedIn?: boolean;
  /** 추가 질문(followup) — 있으면 하단 내비 위 플로팅 버튼 노출.
   *  variant "reunion"이면 재회 후속 질문 시트(상황 선택 + 자유 입력)로 연결 */
  ask?: {
    productId: string;
    price: number;
    saju: AskSaju;
    guestEmail?: string | null;
    variant?: "trouble" | "reunion";
    contextTags?: string[];
  };
  /** 플로팅 공유 버튼 — 카카오톡 → 기기 공유 시트 → 링크 복사 순 폴백 */
  share?: { title: string; imageSlug: string };
}) {
  // 과거 생성분에 표지 뷰(label === "")가 있으면 제외하고 1장부터 시작
  const views = payload.views.filter((v) => v.label !== "");
  const N = views.length;
  const [cur, setCur] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [trackW, setTrackW] = useState(170);
  // 목차 시트 폭 — 스크롤바를 뺀 콘텐츠 영역 폭에 맞춰 본문과 정렬
  const [sheetW, setSheetW] = useState<number | null>(null);

  // 이어보기 복원
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(saved) && saved > 0 && saved < N) setCur(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 묘묘 말풍선 아바타 통일 — 연속 .nyan 그룹의 첫 버블에 아바타, 나머지는 들여쓰기.
  // 렌더 타이밍과 무관하게 동작하도록 DOM 변화를 관찰한다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const process = () => {
      root.querySelectorAll<HTMLDivElement>(".nyan").forEach((el) => {
        if (el.dataset.av) return;
        el.dataset.av = "1";
        const prev = el.previousElementSibling;
        if (prev?.classList.contains("nyan")) {
          el.classList.add("mpad");
        } else if (!el.querySelector(".mav")) {
          const av = document.createElement("span");
          av.className = "mav";
          el.prepend(av);
        }
      });
    };
    process();
    const mo = new MutationObserver(process);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // 진행 바 흰 라벨 폭 (채움 위 글자용 이중 레이어)
  useEffect(() => {
    const update = () => {
      if (trackRef.current) setTrackW(trackRef.current.clientWidth);
      if (rootRef.current) setSheetW(rootRef.current.clientWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [cur]);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(N - 1, i));
    setCur(next);
    setTocOpen(false);
    rootRef.current?.scrollTo({ top: 0 });
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {
      /* ignore */
    }
  };

  const label = `${cur + 1} / ${N}`;
  const fillPct = ((cur + 1) / N) * 100;

  // 공유 시트 — 링크 복사 / 카카오톡 공유
  const shareUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";

  // 공유 클릭 집계 — 실패해도 조용히 무시 (fire-and-forget)
  function trackShare(channel: "link" | "kakao") {
    try {
      const resultId = window.location.pathname.match(/\/results\/([0-9a-f-]{36})/)?.[1];
      if (!resultId) return;
      void fetch("/api/share-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId, channel }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("결과지 링크가 복사됐어요!");
    } catch {
      toast.error("링크 복사에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function kakaoShareResult() {
    trackShare("kakao");
    if (!share) return;
    const kakao = window.Kakao;
    if (kakao?.isInitialized?.() && kakao.Share) {
      try {
        kakao.Share.sendDefault({
          objectType: "feed",
          content: {
            title: share.title,
            description: "냥이가 답을 찾아 드릴게요!",
            imageUrl: `${window.location.origin}/images/${share.imageSlug}.png`,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
        });
        return;
      } catch {
        // SDK 오류 — 아래 폴백으로
      }
    }
    // 카카오 SDK 불가 — 링크 복사로 대신
    await copyShareLink();
  }

  return (
    <div className="lifebook" ref={rootRef}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Do+Hyeon&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: LIFEBOOK_CSS }} />
      <div className="app">
        {/* 사이트 공통 헤더와 같은 모습 — 로고는 홈으로, 발바닥은 목차 열기 */}
        <header className="top">
          <a
            href="/"
            className="logo"
            style={{
              fontSize: 27,
              fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif",
              letterSpacing: "0.05em",
              color: "#C95FC0",
              textDecoration: "none",
            }}
          >
            냥점
          </a>
          <span style={{ marginLeft: "auto" }}>
            <HeaderMenu isLoggedIn={isLoggedIn} />
          </span>
        </header>

        {/* 번들 형제 결과지 탭 — 세그먼트 토글, '고민 사주'가 항상 왼쪽 */}
        {siblingTab && (() => {
          // 알약 세그먼트 — 왼쪽 벽에 딱 붙임, 오른쪽만 둥글게
          // 본 상품(고민/재회 사주)이 항상 왼쪽, 인생 사주가 오른쪽
          const currentFirst = currentTabLabel !== "인생 사주";
          const cell = (first: boolean): React.CSSProperties => ({
            padding: "8px 22px",
            fontSize: 14,
            textDecoration: "none",
            borderRadius: first ? "0 999px 999px 0" : 999,
            color: "#7A6B9E",
          });
          const link = (first: boolean) => (
            <a key="link" href={siblingTab.href} style={cell(first)}>
              {siblingTab.label}
            </a>
          );
          const current = (first: boolean) => (
            <span
              key="cur"
              style={{
                ...cell(first),
                background: "#fff",
                color: "#4A3A72",
                boxShadow: "0 2px 6px rgba(74,58,114,.15)",
              }}
            >
              {currentTabLabel}
            </span>
          );
          return (
            <div style={{ display: "flex", padding: "12px 16px 2px 0" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#E7DDF8",
                  borderRadius: "0 999px 999px 0",
                  padding: "4px 4px 4px 0",
                }}
              >
                {currentFirst ? [current(true), link(false)] : [link(true), current(false)]}
              </div>
            </div>
          );
        })()}

        {/* 플로팅 버튼이 본문 마지막 줄을 가리지 않도록 하단 여백 확보 */}
        <main style={ask || share ? { paddingBottom: ask && share ? 132 : 76 } : undefined}>
          <article className="view on">
            {/* 장 제목 — 번호 없이 절취선(점선+가위) 스타일, 제목 끝 마침표 제거 */}
            <h2 className="chapter">{views[cur].title.replace(/\.$/, "")}</h2>
            <div dangerouslySetInnerHTML={{ __html: views[cur].html }} />
          </article>
        </main>

        {/* 플로팅 공유·추가 질문 버튼 — 모든 장에서 하단 내비 위에 떠 있음 */}
        {(ask || share) && (
          <div
            style={{
              position: "sticky",
              bottom: 76,
              height: 0,
              display: "flex",
              justifyContent: "flex-end",
              padding: "0 16px",
              zIndex: 25,
            }}
          >
          {/* 높이 0 컨테이너 위로 세로 스택 — alignSelf로 바닥을 내비 위에 고정 */}
          <div style={{ position: "relative", alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            {/* 공유 팝오버 — 버튼 바로 위에 떠서 열림 */}
            {/* 공유 칩 — 공유 버튼 주위로 위성처럼 전개 (링크=바로 위, 카카오=왼쪽 대각선) */}
            {share && shareOpen && (
              <>
                <button
                  type="button"
                  onClick={() => { trackShare("link"); void copyShareLink(); }}
                  aria-label="링크 복사"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: -50,
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "#fff",
                    border: "1.5px solid #4A3A72",
                    boxShadow: "0 6px 14px rgba(74,58,114,0.2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M10 14a4.5 4.5 0 006.4 0l3.2-3.2a4.5 4.5 0 00-6.4-6.4l-1.6 1.6" stroke="#4A3A72" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M14 10a4.5 4.5 0 00-6.4 0l-3.2 3.2a4.5 4.5 0 006.4 6.4l1.6-1.6" stroke="#4A3A72" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={kakaoShareResult}
                  aria-label="카카오톡 공유"
                  style={{
                    position: "absolute",
                    right: 58,
                    top: -16,
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "#FFD520",
                    border: "1.5px solid #4A3A72",
                    boxShadow: "0 6px 14px rgba(74,58,114,0.2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path
                      d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7.2S17 4 12 4z"
                      fill="#191919"
                    />
                  </svg>
                </button>
              </>
            )}
            {share && (
              <button
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                aria-label="결과지 공유"
                // 스티커 아웃라인 공유 버튼 — 핑크 링 + 연보라 전송 화살표 + 잉크 테두리 + 주변 도트
                style={{ border: 0, cursor: "pointer", background: "none", padding: 0, width: 54, height: 54, lineHeight: 0 }}
              >
                <svg
                  width="54"
                  height="54"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                  style={{ filter: "drop-shadow(0 5px 12px rgba(122,95,190,0.35))" }}
                >
                  <circle cx="15" cy="7" r="3" fill="#C95FC0" stroke="#4A3A72" strokeWidth="1.6" />
                  <circle cx="42" cy="38" r="3.4" fill="#C95FC0" stroke="#4A3A72" strokeWidth="1.6" />
                  <circle cx="42.5" cy="9" r="2.2" fill="#DCD2F5" stroke="#4A3A72" strokeWidth="1.4" />
                  <circle cx="24" cy="25" r="16.5" fill="#C95FC0" stroke="#4A3A72" strokeWidth="2.2" />
                  <circle cx="24" cy="25" r="12.3" fill="#F8F4FD" stroke="#4A3A72" strokeWidth="2" />
                  <path d="M31.5 17.5 L15.5 24.3 L22.2 26.3 L24.2 33.3 Z" fill="#8F7BD6" stroke="#4A3A72" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {ask && (
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              style={{
                border: 0,
                cursor: "pointer",
                borderRadius: 999,
                height: 44,
                padding: "0 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                lineHeight: 1,
                fontFamily: "inherit",
                fontSize: 13.5,
                color: "#4A3A72",
                background: "#E7DDF8",
                boxShadow: "0 6px 18px rgba(122,95,190,0.25)",
              }}
            >
              {ask.variant === "reunion" ? (
                <>더 물어보기!!{" "}
                  <span
                    style={{
                      fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif",
                      fontSize: 16,
                      lineHeight: 1,
                      color: "#C95FC0",
                      marginLeft: 5,
                    }}
                  >
                    이어서 질문
                  </span>
                </>
              ) : (
                <>또 다른 고민 물어보기!!{" "}
                  <span
                    style={{
                      fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif",
                      fontSize: 16,
                      lineHeight: 1,
                      color: "#C95FC0",
                      marginLeft: 5,
                    }}
                  >
                    50% 할인
                  </span>
                </>
              )}
            </button>
            )}
          </div>
          </div>
        )}

        <nav className="bottom">
          <button className="toc-btn" onClick={() => setTocOpen(true)} aria-label="목차">
            {/* 책갈피(북마크) 아이콘 */}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path
                d="M4 3.5h9a2 2 0 012 2V17l-3.5-2.2L8 17V5.5a2 2 0 00-2-2H4z"
                stroke="#4A3A72"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <path d="M4 3.5v13" stroke="#4A3A72" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          <span id="prog">
            <span className="prog-track" ref={trackRef}>
              <span id="progLabel" className="prog-lab">
                {label}
              </span>
              <span id="progFill" style={{ width: `${fillPct}%` }}>
                <span id="progLabelW" className="prog-lab" style={{ width: trackW }}>
                  {label}
                </span>
              </span>
            </span>
          </span>
          <button className="arrow" disabled={cur === 0} onClick={() => go(cur - 1)} aria-label="이전 장">
            &#8249;
          </button>
          <button className="arrow" disabled={cur === N - 1} onClick={() => go(cur + 1)} aria-label="다음 장">
            &#8250;
          </button>
        </nav>


        {/* 공유 팝오버 바깥 클릭 닫기 (투명 오버레이) */}
        {share && shareOpen && (
          <div onClick={() => setShareOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 24 }} />
        )}

        {/* 추가 질문 — 고민(자유 입력) 또는 재회(상황 선택 + 자유 입력) 시트 */}
        {ask && askOpen && (
          ask.variant === "reunion" ? (
            <AskReunionFollowup
              productId={ask.productId}
              price={ask.price}
              saju={ask.saju}
              contextTags={ask.contextTags ?? []}
              guestEmail={ask.guestEmail}
              onClose={() => setAskOpen(false)}
            />
          ) : (
            <AskAnotherConcern
              productId={ask.productId}
              price={ask.price}
              saju={ask.saju}
              guestEmail={ask.guestEmail}
              defaultOpen
              onClose={() => setAskOpen(false)}
            />
          )
        )}

        <div id="tocSheet" className={tocOpen ? "on" : ""} style={sheetW ? { width: sheetW } : undefined}>
          <div className="toc-bg" onClick={() => setTocOpen(false)} />
          <div className="toc-wrap">
            {/* 패널 위 우측, 배경에 떠 있는 닫기 — 흰 원형 + 낙관 도장 ✕ */}
            <button
              type="button"
              aria-label="목차 닫기"
              onClick={() => setTocOpen(false)}
              className="toc-close"
            >
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="2.5" y="2.5" width="17" height="17" rx="4.5" fill="#C95FC0" />
                <path d="M7.5 7.5 L14.5 14.5 M14.5 7.5 L7.5 14.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="toc-panel">
              <ul>
                {views.map((v, i) => (
                  <li key={i} className={i === cur ? "cur" : ""} onClick={() => go(i)}>
                    {/* 목차 — 번호 없이 제목만, 끝 마침표 제거 */}
                    <span className="toc-t">{v.title.replace(/\.$/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
