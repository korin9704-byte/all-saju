// =====================================================
// 사이트 메타 / 사업자 정보
// =====================================================
// 운영 전 본인 정보로 반드시 교체하세요. 아래는 모두 더미 데이터입니다.

export const siteConfig = {
  name: "냥점",
  tagline: "타고난 운명의 흐름을 읽는 곳",
  description: "냥이가 답을 찾아드릴게요!",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hspjcho9@naver.com",
};

// 통신판매업 / 사업자 정보 — 법적 페이지 및 푸터에 노출됩니다.
// ※ 아래 값은 모두 더미입니다. 운영 전 본인 사업자 정보로 반드시 교체하세요.
export const businessInfo = {
  companyName: "오라클랩",
  representative: "조재영",
  businessNumber: "535-08-03436",
  mailOrderNumber: "2026-서울금천-1229",
  address: "서울특별시 금천구 디지털로 178, A동 지하 2층 M-B203호 21호(가산동)",
  phone: "010-7655-9704",
  phoneNote: "문자만", // 비우면 푸터에서 부가표시 없이 노출
  email: "hspjcho9@naver.com",
  privacyOfficer: "조재영",
  // 호스팅 / 주요 처리 위탁 업체 — 개인정보처리방침에 노출
  hostingProvider: "Vercel Inc.",
  // 시행일 — 약관 / 개인정보처리방침 / 환불정책에 공통 노출
  effectiveDate: "2026-01-01",
};
