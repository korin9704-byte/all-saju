import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* 천문도 배경 SVG */
function CelestialBg() {
  const W = 1100, H = 260;
  const cx = W / 2, cy = H / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg - 90)),
    y: cy + r * Math.sin(toRad(deg - 90)),
  });

  const rings = [220, 170, 115, 70];
  const angles12 = Array.from({ length: 12 }, (_, i) => i * 30);
  const angles24 = Array.from({ length: 24 }, (_, i) => i * 15);

  // 별 위치
  const stars = [
    { x: 60,  y: 40,  r: 1.8 }, { x: 180, y: 25,  r: 1.2 }, { x: 320, y: 60,  r: 1.5 },
    { x: 90,  y: 200, r: 1.3 }, { x: 240, y: 230, r: 1.0 }, { x: 400, y: 210, r: 1.6 },
    { x: 500, y: 30,  r: 1.1 }, { x: 650, y: 20,  r: 1.4 }, { x: 800, y: 45,  r: 1.2 },
    { x: 950, y: 30,  r: 1.6 }, { x: 1040,y: 80,  r: 1.0 }, { x: 700, y: 235, r: 1.3 },
    { x: 860, y: 220, r: 1.5 }, { x: 1000,y: 200, r: 1.1 }, { x: 150, y: 130, r: 0.9 },
    { x: 960, y: 130, r: 0.9 }, { x: 420, y: 15,  r: 0.8 }, { x: 680, y: 250, r: 0.8 },
  ];

  // 성좌 연결선 (좌/우 코너)
  const leftStars  = [[60,40],[180,25],[90,200],[240,230]];
  const rightStars = [[950,30],[1040,80],[860,220],[1000,200]];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* 동심원 */}
      {rings.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          stroke="#A07850" strokeWidth={i === 0 ? 0.6 : 0.4}
          fill="none" opacity={0.18 - i * 0.02} />
      ))}

      {/* 12방위 주요선 */}
      {angles12.map((deg, i) => {
        const p1 = pt(70, deg);
        const p2 = pt(218, deg);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke="#A07850"
          strokeWidth={i % 3 === 0 ? 0.55 : 0.3}
          opacity={i % 3 === 0 ? 0.22 : 0.12} />;
      })}

      {/* 24방위 눈금 */}
      {angles24.map((deg, i) => {
        const p1 = pt(218, deg);
        const p2 = pt(i % 2 === 0 ? 212 : 215, deg);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke="#A07850" strokeWidth="0.4" opacity="0.18" />;
      })}

      {/* 12지 눈금점 */}
      {angles12.map((deg, i) => {
        const p = pt(220, deg);
        return <circle key={i} cx={p.x} cy={p.y} r="1.4"
          fill="#A07850" opacity="0.25" />;
      })}

      {/* 좌측 성좌선 */}
      {leftStars.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = leftStars[i + 1];
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#A07850" strokeWidth="0.5" opacity="0.2" />;
      })}

      {/* 우측 성좌선 */}
      {rightStars.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = rightStars[i + 1];
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#A07850" strokeWidth="0.5" opacity="0.2" />;
      })}

      {/* 별 */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r}
          fill="#C8956A" opacity="0.45" />
      ))}

      {/* 중심 글로우 */}
      <circle cx={cx} cy={cy} r="30" fill="#A07850" fillOpacity="0.06" />
      <circle cx={cx} cy={cy} r="10" fill="#A07850" fillOpacity="0.08" />
    </svg>
  );
}

export function CTA() {
  return (
    <section className="container py-16">
      <div className="relative overflow-hidden rounded-lg bg-[#111111] px-8 py-12 text-center text-canvas">

        {/* 천문도 배경 */}
        <CelestialBg />

        {/* 콘텐츠 */}
        <div className="relative z-10">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-brand-orange uppercase mb-6">
            냥점
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            지금 바로 명운을 확인하십시오
          </h2>
          <p className="mt-3 text-sm text-white/60">
            회원가입 없이도 이용하실 수 있습니다
          </p>
          <div className="mt-7">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-[#E91E8C] bg-transparent text-[#E91E8C] px-6 h-11 text-[15px] font-medium hover:bg-[#E91E8C]/10 transition-colors"
            >
              상품 보러 가기
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
