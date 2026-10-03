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

  // 행운 부적 장 — '내 부적 받기'(서버 렌더 버튼) 클릭을 위임으로 받아
  // 생성 연출(약 5초) 후 이름을 각인해 공개. 위임이라 렌더 타이밍과 무관하게 동작.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".bujeok-start");
      if (!btn) return;
      const stage = btn.closest<HTMLDivElement>(".bujeok-stage");
      if (!stage || stage.dataset.busy) return;
      stage.dataset.busy = "1";
      const key = stage.dataset.key || "earth";
      const name = stage.dataset.name || "";
      const elKr = stage.dataset.el || "";
      const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      btn.remove();
      const load = document.createElement("div");
      load.className = "bujeok-loading";
      load.innerHTML = `<span class="bujeok-spin"></span><p></p>`;
      stage.appendChild(load);
      const msgEl = load.querySelector("p")!;
      const msgs = [
        `${name}님의 사주를 읽는 중…`,
        "괴황지를 펼치는 중…",
        "경면주사를 가는 중…",
        "묘묘가 붓을 드는 중…",
        `${elKr} 기운을 불어넣는 중…`,
      ];
      let mi = 0;
      msgEl.textContent = msgs[0];
      const iv = setInterval(() => {
        mi = Math.min(mi + 1, msgs.length - 1);
        msgEl.textContent = msgs[mi];
      }, 1100);
      const img = new Image();
      const started = Date.now();
      // 연출이 도는 동안 붓글씨 폰트를 미리 로드해 둔다
      try {
        document.fonts?.load("80px 'Nanum Brush Script'");
      } catch {
        /* ignore */
      }
      img.onload = () => {
        const wait = Math.max(0, 5300 - (Date.now() - started));
        setTimeout(() => {
          clearInterval(iv);
          // 고객 이름 세로 각인 합성 — 실패하면 원본 그대로
          let url = `/images/bujeok/${key}.png`;
          try {
            const cv = document.createElement("canvas");
            cv.width = img.naturalWidth;
            cv.height = img.naturalHeight;
            const ctx = cv.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              // 세로 이름 각인 — 다른 문양처럼 종이에 먹이 스며든 붓글씨 느낌:
              // multiply 블렌딩(종이 질감이 비침) + 글자별 흔들림 + 번짐 레이어
              const fs = Math.round(cv.width * 0.075);
              ctx.font = `${fs}px 'Nanum Brush Script', 'Gowun Dodum', serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.globalCompositeOperation = "multiply";
              const x0 = cv.width * 0.915;
              let y = cv.height * 0.07;
              let seed = 0;
              for (const ch of name) seed += ch.charCodeAt(0);
              const rnd = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280 - 0.5;
              };
              for (const ch of name) {
                const jx = rnd() * fs * 0.14;
                const rot = rnd() * 0.09;
                ctx.save();
                ctx.translate(x0 + jx, y);
                ctx.rotate(rot);
                // 1) 먹 번짐 — 흐린 그림자를 넓게 (그림과 같은 주사 빨강 계열)
                ctx.shadowColor = "rgba(205,50,22,0.5)";
                ctx.shadowBlur = fs * 0.14;
                ctx.fillStyle = "rgba(205,52,24,0.45)";
                ctx.fillText(ch, 0, 0);
                // 2) 본 획 — 주사 빨강
                ctx.shadowBlur = fs * 0.04;
                ctx.fillStyle = "rgba(186,32,14,0.85)";
                ctx.fillText(ch, 0, 0);
                ctx.restore();
                y += fs * 1.08;
              }
              ctx.globalCompositeOperation = "source-over";
              url = cv.toDataURL("image/png");
            }
          } catch {
            /* 캔버스 합성 실패 — 원본 이미지 사용 */
          }
          load.remove();
          const out = document.createElement("div");
          out.className = "bujeok-result";
          out.innerHTML =
            `<img class="bujeok-img" src="${url}" alt="행운 부적" />` +
            `<div class="nyan tail" data-av="1"><span class="mav"></span><span class="say">완성이에요! 핸드폰 배경화면으로 간직하면, 묘묘가 ${escHtml(name)}님 곁에서 좋은 기운을 지켜드릴게요.</span></div>` +
            `<a class="bujeok-btn" href="${url}" download="냥점_행운부적_${escHtml(name)}.png">🐾 행운 부적 저장하기</a>`;
          stage.appendChild(out);
        }, wait);
      };
      img.onerror = () => {
        clearInterval(iv);
        msgEl.textContent = "부적을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
        setTimeout(() => {
          load.remove();
          stage.appendChild(btn);
          delete stage.dataset.busy;
        }, 1800);
      };
      img.src = `/images/bujeok/${key}.png`;
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
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
          const base: React.CSSProperties = {
            padding: "7px 20px",
            borderRadius: 999,
            fontSize: 14,
            textDecoration: "none",
          };
          const link = (
            <a key="link" href={siblingTab.href} style={{ ...base, color: "#7A6B9E" }}>
              {siblingTab.label}
            </a>
          );
          const current = (
            <span
              key="cur"
              style={{ ...base, background: "#fff", color: "#4A3A72", boxShadow: "0 2px 8px rgba(122,95,190,0.18)" }}
            >
              {currentTabLabel}
            </span>
          );
          // 본 상품(고민/재회 사주)이 항상 왼쪽, 인생 사주가 오른쪽
          const currentFirst = currentTabLabel !== "인생 사주";
          return (
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 16px 0" }}>
              <div
                style={{
                  display: "flex",
                  background: "#F3EDFB",
                  border: "1px solid #E7DDF8",
                  borderRadius: 999,
                  padding: 4,
                }}
              >
                {currentFirst ? [current, link] : [link, current]}
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
                <>추가 질문하기!!{" "}
                  <span
                    style={{
                      fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif",
                      fontSize: 16,
                      lineHeight: 1,
                      color: "#C95FC0",
                      marginLeft: 5,
                    }}
                  >
                    이어서 묻기
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
            {/* 별이 길을 따라가는 진행 바 */}
            <span className="star-track" ref={trackRef}>
              <span className="star-marker" style={{ left: `${fillPct}%` }}>⭐</span>
            </span>
            <span className="prog-num">{label}</span>
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
