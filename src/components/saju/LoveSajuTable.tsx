import type { Myeongsik } from "@/lib/saju/manseryeok";

/* ── 오행 색상 ── */
const CG_COLOR: Record<string, string> = {
  갑: "#16A34A", 을: "#16A34A",
  병: "#DC2626", 정: "#DB2777",
  무: "#D97706", 기: "#D97706",
  경: "#7C3AED", 신: "#7C3AED",
  임: "#2563EB", 계: "#2563EB",
};
const JJ_COLOR: Record<string, string> = {
  인: "#16A34A", 묘: "#16A34A",
  사: "#DC2626", 오: "#DC2626",
  축: "#D97706", 진: "#D97706", 미: "#D97706", 술: "#D97706",
  신: "#0284C7", 유: "#0284C7",
  자: "#1E40AF", 해: "#1E40AF",
};
const CG_HANJA: Record<string, string> = {
  갑:"甲", 을:"乙", 병:"丙", 정:"丁", 무:"戊",
  기:"己", 경:"庚", 신:"辛", 임:"壬", 계:"癸",
};
const JJ_HANJA: Record<string, string> = {
  자:"子", 축:"丑", 인:"寅", 묘:"卯", 진:"辰", 사:"巳",
  오:"午", 미:"未", 신:"申", 유:"酉", 술:"戌", 해:"亥",
};

function Cell({ hanja, hangul, color }: { hanja: string; hangul: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-3" style={{ background: color }}>
      <span className="text-xl font-bold text-white leading-none">{hanja}</span>
      <span className="text-[10px] text-white/70 mt-1">{hangul}</span>
    </div>
  );
}

function EmptyCell() {
  return (
    <div className="flex items-center justify-center py-3 bg-[#f0f0f0]">
      <span className="text-lg font-bold text-[#ccc]">-</span>
    </div>
  );
}

export function LoveSajuTable({ myeongsik }: { myeongsik: Myeongsik }) {
  const pillars = [
    { label: "시주", data: myeongsik.hour },
    { label: "일주", data: myeongsik.day },
    { label: "월주", data: myeongsik.month },
    { label: "연주", data: myeongsik.year },
  ];

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="grid grid-cols-4 divide-x divide-white/20">
        {pillars.map(({ label }) => (
          <div key={label} className="text-center py-1.5 bg-[#1a1a1a]">
            <span className="text-[9px] font-semibold text-white/50 tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* 천간 */}
      <div className="grid grid-cols-4 gap-px bg-white/10">
        {pillars.map(({ label, data }) =>
          data ? (
            <Cell key={`cg-${label}`} hanja={CG_HANJA[data.cheongan] ?? data.cheongan} hangul={data.cheongan} color={CG_COLOR[data.cheongan] ?? "#888"} />
          ) : (
            <EmptyCell key={`cg-${label}`} />
          )
        )}
      </div>

      {/* 지지 */}
      <div className="grid grid-cols-4 gap-px bg-white/10">
        {pillars.map(({ label, data }) =>
          data ? (
            <Cell key={`jj-${label}`} hanja={JJ_HANJA[data.jiji] ?? data.jiji} hangul={data.jiji} color={JJ_COLOR[data.jiji] ?? "#888"} />
          ) : (
            <EmptyCell key={`jj-${label}`} />
          )
        )}
      </div>
    </div>
  );
}
