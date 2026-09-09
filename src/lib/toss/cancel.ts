import { serverEnv } from "@/lib/env";
import type { TossErrorResponse } from "@/lib/toss/confirm";

// 토스 결제 취소(환불) — https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
export async function cancelTossPayment(
  paymentKey: string,
  cancelReason: string,
): Promise<{ ok: true } | { ok: false; error: TossErrorResponse }> {
  const secretKey = serverEnv().TOSS_SECRET_KEY;
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason }),
  });

  if (res.ok) return { ok: true };

  const error = (await res.json()) as TossErrorResponse;
  // 이미 취소된 결제는 성공으로 간주 (재시도 대비 idempotent)
  if (error.code === "ALREADY_CANCELED_PAYMENT") return { ok: true };
  return { ok: false, error };
}
