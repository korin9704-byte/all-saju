"use client";

// 결과 생성 진행 화면 — /generating 과 /resume 에서 공용
// loading.webp (움직이는 냥이, 9:16) 전체 화면만 표시 — 문구·진행 바 없음
export function AnalysisProgress({
  pct: _pct,
  seconds: _seconds,
  done: _done = false,
  title: _title,
}: {
  pct: number;
  seconds: number;
  done?: boolean;
  title?: string;
}) {
  return (
    <div
      style={{
        minHeight: "88vh",
        background: "url('/images/loading.webp') center top / cover no-repeat",
      }}
    />
  );
}
