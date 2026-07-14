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
  갑: "#A5D6B8", 을: "#BCE0C8",   // 木
  병: "#F5B0AB", 정: "#F8B4CC",   // 火
  무: "#F2C894", 기: "#EDD6A0",   // 土
  경: "#D3D8DE", 신: "#C1C8D0",   // 金
  임: "#A8BEE8", 계: "#B6C9EE",   // 水
};

const JJ_BG: Record<string, string> = {
  인: "#A5D6B8", 묘: "#BCE0C8",                           // 木
  사: "#F5B0AB", 오: "#F5B0AB",                           // 火
  축: "#F2C894", 진: "#F2C894", 미: "#EDD6A0", 술: "#EDD6A0", // 土
  신: "#C1C8D0", 유: "#D3D8DE",                           // 金
  자: "#A8BEE8", 해: "#B6C9EE",                           // 水
};

const DEFAULT_BG = "#E5E7EB";

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
              <span className="text-4xl font-bold text-[#3D3A34] leading-none">
                {data ? (CHEONGAN_HANJA[data.cheongan] ?? data.cheongan) : "—"}
              </span>
              {data && (
                <span className="block text-[11px] mt-1.5 text-[#3D3A34]/55 tracking-wider">
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
              <span className="text-4xl font-bold text-[#3D3A34] leading-none">
                {data ? (JIJI_HANJA[data.jiji] ?? data.jiji) : "—"}
              </span>
              {data && (
                <span className="block text-[11px] mt-1.5 text-[#3D3A34]/55 tracking-wider">
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
