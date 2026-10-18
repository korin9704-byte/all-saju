// =====================================================
// 틱톡 광고 — 픽셀 ID + 이벤트 API(서버 전송)
// =====================================================
// 브라우저 픽셀과 같은 event_id(주문번호)를 보내 틱톡이 중복 없이 하나로 합친다.
import { createHash } from "crypto";

export const TIKTOK_PIXEL_ID = "DBA9ALRC77U6POU9B3V0";

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export type TikTokPurchaseInput = {
  orderId: string;
  amount: number;
  productSlug?: string | null;
  productName?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  ttp?: string | null;
  ttclid?: string | null;
  pageUrl?: string | null;
};

/** 결제 완료(CompletePayment)를 이벤트 API로 전송. 실패해도 예외를 던지지 않는다 (결제 흐름 보호). */
export async function sendTikTokCompletePayment(input: TikTokPurchaseInput): Promise<void> {
  const token = process.env.TIKTOK_EVENTS_API_TOKEN;
  if (!token) return;

  const user: Record<string, string> = {};
  if (input.email) user.email = sha256(input.email);
  if (input.ip) user.ip = input.ip;
  if (input.userAgent) user.user_agent = input.userAgent;
  if (input.ttp) user.ttp = input.ttp;
  if (input.ttclid) user.ttclid = input.ttclid;

  const body = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    // 틱톡 Events Manager '테스트 이벤트' 확인용 — 설정돼 있으면 실집계에 섞이지 않는다
    ...(process.env.TIKTOK_TEST_EVENT_CODE ? { test_event_code: process.env.TIKTOK_TEST_EVENT_CODE } : {}),
    data: [
      {
        event: "CompletePayment",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.orderId,
        user,
        properties: {
          contents: input.productSlug
            ? [{ content_id: input.productSlug, content_name: input.productName ?? undefined, content_type: "product", quantity: 1, price: input.amount }]
            : undefined,
          content_type: "product",
          currency: "KRW",
          value: input.amount,
        },
        ...(input.pageUrl ? { page: { url: input.pageUrl } } : {}),
      },
    ],
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Access-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    const json = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (!res.ok || json?.code !== 0) {
      console.error("[tiktok-events] 전송 실패:", res.status, json?.code, json?.message);
    }
  } catch (err) {
    console.error("[tiktok-events] 전송 오류:", err);
  }
}
