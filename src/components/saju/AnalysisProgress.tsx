"use client";

// "행운의 냥이가 집중해서 분석 중" 진행 화면 — /generating 과 /resume 에서 공용
export function AnalysisProgress({
  pct,
  seconds,
  done = false,
}: {
  pct: number;
  seconds: number;
  done?: boolean;
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

      <div className="container py-16 max-w-sm text-center">
        {/* 메인 메시지 */}
        <h1 className="text-lg font-bold text-ink leading-snug mb-6">
          {done
            ? <>분석 완료! 결과 페이지로 이동할게요...🐾</>
            : <>행운의 냥이가 집중해서 분석 중...🐾</>}
        </h1>

        {/* 프로그레스 바 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">🐱</div>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              id="progress-fill"
              className="h-full rounded-full"
              style={{ width: `${pct.toFixed(0)}%`, background: "linear-gradient(90deg, #f59e0b, #f43f5e)" }}
            />
          </div>
          <span className="text-sm font-mono text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
        </div>

        {/* 남은 시간 */}
        <p className="text-sm text-muted-foreground mb-2">
          예상 남은 시간: 약 <span>{seconds}</span>초
        </p>
        <p className="text-xs text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </>
  );
}
