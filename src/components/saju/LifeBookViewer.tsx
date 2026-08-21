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

export default function LifeBookViewer({
  payload,
  storageKey,
  siblingTab,
}: {
  payload: LifeReportPayload;
  storageKey: string;
  /** 번들 형제 결과지(고민 사주)로 이동하는 탭 */
  siblingTab?: { label: string; href: string };
}) {
  // 과거 생성분에 표지 뷰(label === "")가 있으면 제외하고 1장부터 시작
  const views = payload.views.filter((v) => v.label !== "");
  const N = views.length;
  const [cur, setCur] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [trackW, setTrackW] = useState(170);

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
        <header className="top">
          <span className="logo">냥점</span>
          <button className="menu-btn" onClick={() => setTocOpen(true)} aria-label="목차">
            &#9776;
          </button>
        </header>

        {/* 번들 형제 결과지 탭 — 결과지 페이지의 알약 탭과 동일한 문법 */}
        {siblingTab && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "12px 16px 0" }}>
            <a
              href={siblingTab.href}
              style={{
                padding: "8px 20px", borderRadius: 999, fontSize: 14, textDecoration: "none",
                background: "#fff", border: "1px solid #E7DDF8", color: "#4A3A72",
              }}
            >
              {siblingTab.label}
            </a>
            <span
              style={{
                padding: "8px 20px", borderRadius: 999, fontSize: 14, color: "#fff",
                background: "linear-gradient(90deg, #8F7BD6, #C95FC0)",
              }}
            >
              인생 사주
            </span>
          </div>
        )}

        <main>
          <article className="view on">
            {views[cur].label && (
              <p className="part">
                <span>{views[cur].label}</span>
              </p>
            )}
            <h2 className="chapter">{views[cur].title}</h2>
            <div dangerouslySetInnerHTML={{ __html: views[cur].html }} />
          </article>
        </main>

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

        <div id="tocSheet" className={tocOpen ? "on" : ""}>
          <div className="toc-bg" onClick={() => setTocOpen(false)} />
          <div className="toc-panel">
            <div className="toc-handle" />
            <ul>
              {views.map((v, i) => (
                <li key={i} className={i === cur ? "cur" : ""} onClick={() => go(i)}>
                  <span className="toc-no">{v.label}</span>
                  <span className="toc-t">{v.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
