// =====================================================
// 주문 유입 경로 — 방문 시 쿠키(nj_attr)에 기록, 주문 생성 시 orders.source/attribution 로 저장
// =====================================================
// 기준: 마지막으로 '광고 클릭(fbclid·ttclid·gclid) 또는 UTM'이 붙어 들어온 방문.
// 꼬리표 없이 외부 사이트에서 들어오면, 기존 기록이 없을 때만 referrer 로 기록.

export const ATTR_COOKIE = "nj_attr";
export const ATTR_MAX_AGE_DAYS = 30;

export type Attribution = {
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  click?: "fbclid" | "ttclid" | "gclid";
  landing?: string;
  referrer?: string;
  at: string;
};

/** utm_source·클릭 ID·referrer 로 유입처 이름을 정한다 */
export function classifySource(a: { utm_source?: string; click?: string; referrer?: string }): string {
  const u = (a.utm_source ?? "").toLowerCase();
  if (a.click === "ttclid" || u.includes("tiktok")) return "tiktok";
  if (u.includes("insta") || u === "ig") return "instagram";
  if (a.click === "fbclid" || u.includes("meta") || u.includes("facebook") || u === "fb") return "meta";
  if (u.includes("naver")) return "naver";
  if (a.click === "gclid" || u.includes("google")) return "google";
  if (u.includes("kakao")) return "kakao";
  if (u) return u.slice(0, 40);
  let host = "";
  try {
    host = a.referrer ? new URL(a.referrer).hostname : "";
  } catch {
    host = "";
  }
  if (!host) return "direct";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("instagram")) return "instagram";
  if (host.includes("facebook") || host === "l.facebook.com" || host === "lm.facebook.com") return "meta";
  if (host.includes("naver")) return "naver";
  if (host.includes("google")) return "google";
  if (host.includes("kakao") || host.includes("daum")) return "kakao";
  return "other";
}

/** 주문 생성 라우트에서 쿠키를 읽어 orders 컬럼 값으로 변환 (없거나 깨졌으면 direct) */
export function attributionFromCookie(raw: string | undefined): { source: string; attribution: Attribution | null } {
  if (!raw) return { source: "direct", attribution: null };
  try {
    const a = JSON.parse(decodeURIComponent(raw)) as Attribution;
    return { source: a.source || "direct", attribution: a };
  } catch {
    return { source: "direct", attribution: null };
  }
}
