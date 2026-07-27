"use client";

// 결과 생성 진행 화면 — /generating 과 /resume 에서 공용
// 냥이 이미지(loading-cat.webp) + 진행 바 (이모지 없음)
export function AnalysisProgress({
  pct,
  seconds,
  done = false,
  title,
}: {
  pct: number;
  seconds: number;
  done?: boolean;
  title?: string;
}) {
  return (
    <>
      <style>{`
        @keyframes barPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        #progress-fill { transition: width 1s linear; animation: barPulse 2s ease-in-out infinite; }
      `}</style>

      <div className="container py-10 max-w-sm text-center">
        {/* 냥이 이미지 */}
        <img
          src="/images/loading-cat.webp?v=3"
          alt=""
          className="w-full rounded-3xl mb-8"
        />

        {/* 메인 메시지 */}
        <h1 className="text-lg font-bold text-ink leading-snug mb-6">
          {done
            ? <>분석 완료! 결과 페이지로 이동할게요...</>
            : <>{title ?? "행운의 냥이가 집중해서 분석 중..."}</>}
        </h1>

        {/* 프로그레스 바 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-3 bg-white/80 rounded-full overflow-hidden">
            <div
              id="progress-fill"
              className="h-full rounded-full"
              style={{ width: `${pct.toFixed(0)}%`, background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" }}
            />
          </div>
          <span className="text-sm font-mono text-[#7A6B9E] w-8 text-right">{pct.toFixed(0)}%</span>
        </div>

        {/* 남은 시간 */}
        <p className="text-sm text-[#7A6B9E] mb-2">
          예상 남은 시간: 약 <span>{seconds}</span>초
        </p>
        <p className="text-xs text-[#9C8FBF]">잠시만 기다려 주세요...</p>
      </div>
    </>
  );
}
