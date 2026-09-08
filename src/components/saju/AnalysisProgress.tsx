"use client";

// 결과 생성 진행 화면 — /generating 과 /resume 에서 공용
// 보라 밤하늘 + 잔별 배경 위에, 진행률만큼 별이 이어져 냥이 얼굴 별자리가 그려진다.

// 냥이 얼굴 별자리 좌표 (viewBox 260x220) — 왼뺨→왼귀→귀사이→오른귀→오른뺨→턱을 돌아 닫힘
const CAT_PTS: [number, number][] = [
  [40, 140], [58, 68], [82, 30], [106, 62], [152, 60],
  [178, 26], [200, 66], [218, 138], [186, 180], [130, 194], [74, 182],
];

export function AnalysisProgress({
  pct,
  seconds: _seconds,
  done = false,
  title: _title,
}: {
  pct: number;
  seconds: number;
  done?: boolean;
  title?: string;
}) {
  const total = CAT_PTS.length;
  const complete = done || pct >= 100;
  const lit = complete ? total : Math.max(1, Math.min(total, Math.ceil((pct / 100) * total)));
  const head = CAT_PTS[lit - 1];

  const toPath = (pts: [number, number][]) =>
    "M" + pts.map(([x, y]) => `${x} ${y}`).join(" L");

  // 밝혀진 경로 / 남은 경로(점선, 마지막 별에서 시작해 처음 별로 닫힘)
  const litPath = toPath(CAT_PTS.slice(0, lit)) + (complete ? ` L${CAT_PTS[0][0]} ${CAT_PTS[0][1]}` : "");
  const restPath = complete ? "" : toPath([...CAT_PTS.slice(lit - 1), CAT_PTS[0]]);

  return (
    <>
      <style>{`
        @keyframes starTwinkleA { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes starTwinkleB { 0%,100%{opacity:0.35} 50%{opacity:1} }
        @keyframes headGlow { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      <div
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ minHeight: "88vh", background: "linear-gradient(180deg,#584A93,#7D6BB8 55%,#B394CF)" }}
      >
        {/* 배경 잔별 */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 375 700" preserveAspectRatio="none" aria-hidden>
          <g style={{ animation: "starTwinkleA 3.2s ease-in-out infinite" }}>
            <circle cx="40" cy="70" r="1.4" fill="#fff" opacity="0.8" />
            <circle cx="200" cy="66" r="1.3" fill="#fff" opacity="0.7" />
            <circle cx="340" cy="110" r="1.4" fill="#fff" opacity="0.8" />
            <circle cx="350" cy="250" r="1.1" fill="#fff" opacity="0.6" />
            <circle cx="60" cy="450" r="1.2" fill="#fff" opacity="0.6" />
            <circle cx="230" cy="580" r="1.2" fill="#fff" opacity="0.6" />
            <circle cx="320" cy="640" r="1.3" fill="#fff" opacity="0.6" />
            <path d="M70 100 l1.6 3.4 3.6 0.5 -2.6 2.5 0.6 3.6 -3.2 -1.8 -3.2 1.8 0.6 -3.6 -2.6 -2.5 3.6 -0.5 Z" fill="#fff" opacity="0.55" />
            <path d="M130 600 l1.6 3.4 3.6 0.5 -2.6 2.5 0.6 3.6 -3.2 -1.8 -3.2 1.8 0.6 -3.6 -2.6 -2.5 3.6 -0.5 Z" fill="#fff" opacity="0.5" />
          </g>
          <g style={{ animation: "starTwinkleB 3.2s ease-in-out infinite" }}>
            <circle cx="110" cy="40" r="1" fill="#fff" opacity="0.5" />
            <circle cx="290" cy="46" r="1" fill="#fff" opacity="0.5" />
            <circle cx="30" cy="180" r="1" fill="#fff" opacity="0.4" />
            <circle cx="20" cy="330" r="1.3" fill="#fff" opacity="0.6" />
            <circle cx="352" cy="390" r="1" fill="#fff" opacity="0.5" />
            <circle cx="300" cy="490" r="1.4" fill="#fff" opacity="0.7" />
            <circle cx="150" cy="530" r="1" fill="#fff" opacity="0.4" />
            <circle cx="90" cy="620" r="1" fill="#fff" opacity="0.5" />
            <circle cx="180" cy="120" r="1" fill="#fff" opacity="0.45" />
            <path d="M310 320 l1.6 3.4 3.6 0.5 -2.6 2.5 0.6 3.6 -3.2 -1.8 -3.2 1.8 0.6 -3.6 -2.6 -2.5 3.6 -0.5 Z" fill="#fff" opacity="0.45" />
          </g>
        </svg>

        {/* 냥이 별자리 — 진행률만큼 별이 이어진다 */}
        <div className="relative -mt-10 text-center">
          <svg width="260" height="220" viewBox="0 0 260 220" style={{ overflow: "visible" }} aria-hidden>
            <path d={litPath} stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" fill="none" style={{ transition: "d 0.6s" }} />
            {restPath && (
              <path d={restPath} stroke="rgba(255,255,255,0.22)" strokeWidth="1.6" strokeDasharray="4 6" fill="none" />
            )}
            {CAT_PTS.map(([x, y], i) => {
              const isHead = !complete && i === lit - 1;
              if (isHead) return null;
              return i < lit
                ? <circle key={i} cx={x} cy={y} r="4.5" fill="#FBE38E" />
                : <circle key={i} cx={x} cy={y} r="4" fill="rgba(255,255,255,0.3)" />;
            })}
            {!complete && (
              <circle
                cx={head[0]} cy={head[1]} r="7" fill="#FBE38E"
                style={{ filter: "drop-shadow(0 0 8px #FBE38E)", animation: "headGlow 1.6s ease-in-out infinite" }}
              />
            )}
            {/* 완성 시 냥이 눈·코 */}
            {complete && (
              <g fill="#FBE38E" style={{ filter: "drop-shadow(0 0 6px #FBE38E)" }}>
                <circle cx="100" cy="112" r="4" />
                <circle cx="160" cy="112" r="4" />
                <path d="M126 138 L134 138 L130 144 Z" />
              </g>
            )}
          </svg>
          <p className="mt-2 text-[14.5px] text-white">지금 결과지를 쓰고 있어요...</p>
          <p className="mt-1 text-xs text-white/75">보통 1~2분 정도 걸려요!!</p>
        </div>
      </div>
    </>
  );
}
