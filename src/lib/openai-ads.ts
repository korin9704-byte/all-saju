// =====================================================
// 챗GPT(OpenAI) 광고 — 픽셀 ID + 전환 API(서버 전송)
// =====================================================
// 브라우저 픽셀과 같은 event id(주문번호)를 보내 중복 없이 하나로 합친다.

export const OPENAI_PIXEL_ID = "H7VUdhd6ahTUdncCVzR1R3";

const ENDPOINT = `https://bzr.openai.com/v1/events?pid=${OPENAI_PIXEL_ID}`;

export type OpenAIOrderInput = {
  orderId: string;
  amount: number;
  productSlug?: string | null;
  productName?: string | null;
  sourceUrl?: string | null;
  /** true면 기록하지 않고 형식 검증만 (테스트용) */
  validateOnly?: boolean;
};

/** 결제 완료(order_created)를 전환 API로 전송. 실패해도 예외를 던지지 않는다 (결제 흐름 보호). */
export async function sendOpenAIOrderCreated(input: OpenAIOrderInput): Promise<{ ok: boolean; status?: number; body?: string }> {
  const key = process.env.OPENAI_CONVERSION_API_KEY;
  if (!key) return { ok: false };

  const body = {
    validate_only: !!input.validateOnly,
    events: [
      {
        id: input.orderId,
        type: "order_created",
        timestamp_ms: Date.now(),
        source_url: input.sourceUrl || "https://nyangjeom.com/checkout/success",
        action_source: "web",
        data: {
          type: "contents",
          amount: Math.round(input.amount),
          currency: "KRW",
          ...(input.productSlug
            ? { contents: [{ id: input.productSlug, name: input.productName ?? undefined, content_type: "product", quantity: 1, amount: Math.round(input.amount), currency: "KRW" }] }
            : {}),
        },
      },
    ],
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) console.error("[openai-conv] 전송 실패:", res.status, text.slice(0, 300));
    return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
  } catch (err) {
    console.error("[openai-conv] 전송 오류:", err);
    return { ok: false };
  }
}
