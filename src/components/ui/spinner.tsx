/** 결제·제출 대기 공용 스피너 — 위저드 다음(>) 버튼 로딩 표시와 동일한 모양 */
export function Spinner({
  size = 18,
  track = "#C9BDE6",
  arc = "#C95FC0",
  className,
}: {
  size?: number;
  /** 바탕 링 색 */
  track?: string;
  /** 도는 호 색 */
  arc?: string;
  className?: string;
}) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10" cy="10" r="7" stroke={track} strokeWidth="2.4" />
      <path d="M10 3 a7 7 0 0 1 7 7" stroke={arc} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
