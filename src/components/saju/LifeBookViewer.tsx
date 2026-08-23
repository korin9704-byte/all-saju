"use client";

// =====================================================
// 인생 사주 — 모바일 챕터 뷰어 (13장 평생 리포트)
// =====================================================
// 샘플 뷰어(public/sample-mobile.html)를 React 로 이식.
// 서버에서 조립된 views(HTML)를 장 단위로 넘기며 읽는다.
// 표지 없이 1장부터 바로 시작한다 (과거 payload 의 표지 뷰는 걸러냄).

import { useEffect, useRef, useState } from "react";
import type { LifeReportPayload } from "@/lib/saju/life-report";
import { LIFEBOOK_CSS } from "./lifebook-css";
import { HeaderMenu } from "@/components/HeaderMenu";
import { AskAnotherConcern, type AskSaju } from "@/components/saju/AskAnotherConcern";

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
}: {
  payload: LifeReportPayload;
  storageKey: string;
  /** 번들 형제 결과지로 이동하는 탭 */
  siblingTab?: { label: string; href: string };
  /** 현재 결과지 탭 라벨 (기본: 인생 사주) */
  currentTabLabel?: string;
  /** 헤더 메뉴(발바닥) 로그인 상태 */
  isLoggedIn?: boolean;
  /** 추가 질문(50% 할인 followup) — 있으면 하단 내비에 버튼 노출 */
  ask?: { productId: string; price: number; saju: AskSaju; guestEmail?: string | null };
}) {
  // 과거 생성분에 표지 뷰(label === "")가 있으면 제외하고 1장부터 시작
  const views = payload.views.filter((v) => v.label !== "");
  const N = views.length;
  const [cur, setCur] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
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

  return (
    <div className="lifebook" ref={rootRef}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: LIFEBOOK_CSS }} />
      <div className="app">
        {/* 사이트 공통 헤더와 같은 모습 — 로고는 홈으로, 발바닥은 목차 열기 */}
        <header className="top">
          <a
            href="/"
            className="logo"
            style={{ fontSize: 20, letterSpacing: "0.08em", color: "#4A3A72", textDecoration: "none" }}
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
          const currentFirst = currentTabLabel === "고민 사주";
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
        <main style={ask ? { paddingBottom: 76 } : undefined}>
          <article className="view on">
            {views[cur].sub ? (
              <p className="sub-h" style={{ marginTop: 4 }}>
                {views[cur].label ? `${fmtLabel(views[cur].label)} ` : ""}
                {views[cur].title}
              </p>
            ) : (
              // 알약 없이 "01. 제목" 한 줄
              <h2 className="chapter">
                {views[cur].label ? `${fmtLabel(views[cur].label)} ` : ""}
                {views[cur].title}
              </h2>
            )}
            <div dangerouslySetInnerHTML={{ __html: views[cur].html }} />
          </article>
        </main>

        {/* 플로팅 추가 질문 버튼 — 모든 장에서 하단 내비 위에 떠 있음 */}
        {ask && (
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
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              style={{
                transform: "translateY(-100%)",
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
              또 다른 고민 물어보기 (50% 할인)
            </button>
          </div>
        )}

        <nav className="bottom">
          <button className="toc-btn" onClick={() => setTocOpen(true)}>
            목차
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

        {/* 추가 질문 — 고민 입력 후 50% 할인 결제 (기존 followup 플로우 재사용) */}
        {ask && askOpen && (
          <AskAnotherConcern
            productId={ask.productId}
            price={ask.price}
            saju={ask.saju}
            guestEmail={ask.guestEmail}
            defaultOpen
            onClose={() => setAskOpen(false)}
          />
        )}

        <div id="tocSheet" className={tocOpen ? "on" : ""} style={sheetW ? { width: sheetW } : undefined}>
          <div className="toc-bg" onClick={() => setTocOpen(false)} />
          <div className="toc-panel">
            <div className="toc-handle" />
            <ul>
              {views.map((v, i) => (
                <li key={i} className={i === cur ? "cur" : ""} onClick={() => go(i)}>
                  {/* 번호 알약 없이 "01. 제목" 한 줄 */}
                  <span className="toc-t">
                    {v.label ? `${fmtLabel(v.label)} ` : ""}
                    {v.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
