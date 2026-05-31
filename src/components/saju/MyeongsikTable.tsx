import type { Myeongsik } from "@/lib/saju/manseryeok";

const CHEONGAN_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

const JIJI_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

/* ── 오행 배경색 ────────────────────────────────────────
   木=green  火=red/pink  土=amber  金=gray  水=navy
──────────────────────────────────────────────────────── */
const CG_BG: Record<string, string> = {
  갑: "#16A34A", 을: "#22C55E",   // 木
  병: "#EF4444", 정: "#EC4899",   // 火
  무: "#D97706", 기: "#CA8A04",   // 土
  경: "#9CA3AF", 신: "#6B7280",   // 金
  임: "#1E40AF", 계: "#1D4ED8",   // 水
};

const JJ_BG: Record<string, string> = {
  인: "#16A34A", 묘: "#22C55E",                           // 木
  사: "#EF4444", 오: "#EF4444",                           // 火
  축: "#D97706", 진: "#D97706", 미: "#CA8A04", 술: "#CA8A04", // 土
  신: "#6B7280", 유: "#9CA3AF",                           // 金
  자: "#1E40AF", 해: "#1D4ED8",                           // 水
};

const DEFAULT_BG = "#d1d5db";

export function MyeongsikTable({ myeongsik }: { myeongsik: Myeongsik }) {
  const pillars = [
    { label: "시주", data: myeongsik.hour },
    { label: "일주", data: myeongsik.day },
    { label: "월주", data: myeongsik.month },
    { label: "년주", data: myeongsik.year },
  ];

  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-white/10">

        {/* 헤더 라벨 */}
        {pillars.map(({ label }) => (
          <div key={label} className="py-3 text-center" style={{ background: "#1a1a1a" }}>
            <span className="text-[11px] font-semibold tracking-widest text-white/60">{label}</span>
          </div>
        ))}

        {/* 천간 행 */}
        {pillars.map(({ label, data }) => {
          const bg = data ? (CG_BG[data.cheongan] ?? DEFAULT_BG) : DEFAULT_BG;
          return (
            <div key={`gan-${label}`} className="py-5 text-center border-t border-white/10"
              style={{ background: bg }}>
              <span className="text-4xl font-bold text-white leading-none">
                {data ? (CHEONGAN_HANJA[data.cheongan] ?? data.cheongan) : "—"}
              </span>
              {data && (
                <span className="block text-[11px] mt-1.5 text-white/60 tracking-wider">
                  {data.cheongan}
                </span>
              )}
            </div>
          );
        })}

        {/* 지지 행 */}
        {pillars.map(({ label, data }) => {
          const bg = data ? (JJ_BG[data.jiji] ?? DEFAULT_BG) : DEFAULT_BG;
          return (
            <div key={`ji-${label}`} className="py-5 text-center border-t border-white/10"
              style={{ background: bg }}>
              <span className="text-4xl font-bold text-white leading-none">
                {data ? (JIJI_HANJA[data.jiji] ?? data.jiji) : "—"}
              </span>
              {data && (
                <span className="block text-[11px] mt-1.5 text-white/60 tracking-wider">
                  {data.jiji}
                </span>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
