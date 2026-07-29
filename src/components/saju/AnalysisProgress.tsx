"use client";

// 결과 생성 진행 화면 — /generating 과 /resume 에서 공용
// loading-bg.webp 전체 배경 + 상단 페이드 위에 문구·진행 바
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

      <div
        className="flex flex-col"
        style={{
          minHeight: "88vh",
          background:
            "linear-gradient(rgba(248,244,253,0.97) 0%, rgba(248,244,253,0.85) 14%, rgba(248,244,253,0) 34%), url('/images/loading-bg.webp') center bottom / cover no-repeat",
        }}
      >
        <div className="w-full max-w-sm mx-auto px-6 pt-10 text-center">
          {/* 메인 메시지 */}
          <h1
            className="text-lg font-bold text-[#4A3A72] leading-snug mb-6"
            style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}
          >
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
            <span className="text-sm text-[#7A6B9E] w-8 text-right">{pct.toFixed(0)}%</span>
          </div>

          {/* 남은 시간 */}
          <p className="text-sm text-[#7A6B9E]" style={{ textShadow: "0 0 10px rgba(255,255,255,0.9)" }}>
            예상 남은 시간: 약 <span>{seconds}</span>초
          </p>
        </div>
      </div>
    </>
  );
}
