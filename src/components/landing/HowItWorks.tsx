/* ─── 이용 안내 아이콘 (배경 없음, 브론즈 톤) ─────────── */

/** 01 상담 선택 — 두 문서 */
function IconConsult() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6"  y="10" width="16" height="20" rx="2" stroke="#B8926A" strokeWidth="1.4" fill="#C8A882" fillOpacity="0.18"/>
      <line x1="10" y1="16" x2="18" y2="16" stroke="#B8926A" strokeWidth="1.0" opacity="0.7"/>
      <line x1="10" y1="20" x2="18" y2="20" stroke="#B8926A" strokeWidth="1.0" opacity="0.5"/>
      <line x1="10" y1="24" x2="15" y2="24" stroke="#B8926A" strokeWidth="1.0" opacity="0.4"/>
      <rect x="26" y="18" width="16" height="20" rx="2" stroke="#B8926A" strokeWidth="1.4" fill="#C8A882" fillOpacity="0.18"/>
      <line x1="30" y1="24" x2="38" y2="24" stroke="#B8926A" strokeWidth="1.0" opacity="0.7"/>
      <line x1="30" y1="28" x2="38" y2="28" stroke="#B8926A" strokeWidth="1.0" opacity="0.5"/>
      <line x1="30" y1="32" x2="35" y2="32" stroke="#B8926A" strokeWidth="1.0" opacity="0.4"/>
    </svg>
  );
}

/** 02 정보 입력 — 달력 그리드 */
function IconInput() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="10" width="34" height="28" rx="2.5" stroke="#B8926A" strokeWidth="1.4" fill="#C8A882" fillOpacity="0.12"/>
      <line x1="7"  y1="18" x2="41" y2="18" stroke="#B8926A" strokeWidth="1.0" opacity="0.6"/>
      <line x1="7"  y1="26" x2="41" y2="26" stroke="#B8926A" strokeWidth="0.7" opacity="0.35"/>
      <line x1="19" y1="18" x2="19" y2="38" stroke="#B8926A" strokeWidth="0.7" opacity="0.35"/>
      <line x1="29" y1="18" x2="29" y2="38" stroke="#B8926A" strokeWidth="0.7" opacity="0.35"/>
      {/* 헤더 점 3개 */}
      <circle cx="14" cy="14" r="1.5" fill="#B8926A" opacity="0.6"/>
      <circle cx="24" cy="14" r="1.5" fill="#B8926A" opacity="0.6"/>
      <circle cx="34" cy="14" r="1.5" fill="#B8926A" opacity="0.6"/>
      {/* 데이터 점 */}
      <circle cx="14" cy="22" r="2"   fill="#B8926A" fillOpacity="0.55"/>
      <circle cx="24" cy="22" r="2"   fill="#B8926A" fillOpacity="0.35"/>
      <circle cx="34" cy="22" r="2"   fill="#B8926A" fillOpacity="0.35"/>
      <circle cx="14" cy="32" r="1.5" fill="#B8926A" fillOpacity="0.25"/>
    </svg>
  );
}

/** 03 결제 — 원형 체크 */
function IconPay() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="16" stroke="#B8926A" strokeWidth="1.4" fill="#C8A882" fillOpacity="0.12"/>
      <polyline
        points="16,24 21,30 32,17"
        stroke="#B8926A" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** 04 결과 확인 — 두루마리 */
function IconResult() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 원통형 상단 */}
      <ellipse cx="24" cy="12" rx="12" ry="3" stroke="#B8926A" strokeWidth="1.2" fill="#C8A882" fillOpacity="0.22"/>
      {/* 몸통 */}
      <rect x="12" y="12" width="24" height="24" fill="#C8A882" fillOpacity="0.12" stroke="#B8926A" strokeWidth="1.2"/>
      {/* 원통형 하단 */}
      <ellipse cx="24" cy="36" rx="12" ry="3" stroke="#B8926A" strokeWidth="1.2" fill="#C8A882" fillOpacity="0.22"/>
      {/* 텍스트 라인 */}
      <line x1="17" y1="20" x2="31" y2="20" stroke="#B8926A" strokeWidth="1.1" opacity="0.65"/>
      <line x1="17" y1="25" x2="31" y2="25" stroke="#B8926A" strokeWidth="1.1" opacity="0.50"/>
      <line x1="17" y1="30" x2="25" y2="30" stroke="#B8926A" strokeWidth="1.1" opacity="0.35"/>
    </svg>
  );
}

/* ─── 이용 안내 섹션 ──────────────────────────────── */
export function HowItWorks() {
  const steps = [
    { n: "01", t: "상담 선택", d: "목적에 맞는 상담을 선택",           Icon: IconConsult },
    { n: "02", t: "정보 입력", d: "생년월일시와 성별을 입력",           Icon: IconInput  },
    { n: "03", t: "결제",      d: "토스페이먼츠로 안전하게 결제",       Icon: IconPay    },
    { n: "04", t: "결과 확인", d: "정밀하게 작성된 명운 리포트를 확인", Icon: IconResult },
  ];

  return (
    <section id="how-it-works" className="container py-20 border-t border-hairline">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-12">
        이용 안내
      </h2>
      <ol className="grid gap-10 md:grid-cols-4">
        {steps.map((s) => (
          <li key={s.n}>
            {/* 아이콘 — 배경 없음 */}
            <div className="w-14 h-14 flex items-center justify-center mb-4">
              <s.Icon />
            </div>
            <p className="text-xs font-mono font-bold text-brand-orange mb-2">{s.n}</p>
            <p className="text-base font-semibold mb-1.5">{s.t}</p>
            <p className="text-sm text-body leading-relaxed">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
