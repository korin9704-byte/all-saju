import type { Myeongsik } from "@/lib/saju/manseryeok";

/* ── 오행 색상 (MyeongsikTable과 동일한 파스텔 팔레트) ── */
const CG_COLOR: Record<string, string> = {
  갑: "#A5D6B8", 을: "#BCE0C8",   // 木
  병: "#F5B0AB", 정: "#F8B4CC",   // 火
  무: "#F2C894", 기: "#EDD6A0",   // 土
  경: "#D3D8DE", 신: "#C1C8D0",   // 金
  임: "#A8BEE8", 계: "#B6C9EE",   // 水
};
const JJ_COLOR: Record<string, string> = {
  인: "#A5D6B8", 묘: "#BCE0C8",                           // 木
  사: "#F5B0AB", 오: "#F5B0AB",                           // 火
  축: "#F2C894", 진: "#F2C894", 미: "#EDD6A0", 술: "#EDD6A0", // 土
  신: "#C1C8D0", 유: "#D3D8DE",                           // 金
  자: "#A8BEE8", 해: "#B6C9EE",                           // 水
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
      <span className="text-xl font-bold text-[#3D3A34] leading-none">{hanja}</span>
      <span className="text-[10px] text-[#3D3A34]/55 mt-1">{hangul}</span>
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
