'use client'
import { useEffect } from 'react'

export function PurchasePixel({ amount, orderId, productSlug, productName }: { amount: number; orderId?: string; productSlug?: string; productName?: string }) {
  useEffect(() => {
    const w = window as any
    if (w.fbq) {
      w.fbq('track', 'Purchase', { value: amount, currency: 'KRW' })
    }
    // 틱톡 픽셀 — 결제 완료 (상품 정보 포함, event_id = 주문번호: 추후 이벤트 API 중복 제거용)
    w.ttq?.track?.(
      'CompletePayment',
      {
        contents: productSlug
          ? [{ content_id: productSlug, content_name: productName, content_type: 'product', quantity: 1, price: amount }]
          : undefined,
        value: amount,
        currency: 'KRW',
      },
      orderId ? { event_id: orderId } : undefined,
    )
    // 챗GPT 픽셀 — 결제 완료 (event_id = 주문번호)
    w.oaiq?.(
      'measure',
      'order_created',
      {
        type: 'contents',
        amount,
        currency: 'KRW',
        contents: productSlug ? [{ id: productSlug, name: productName, content_type: 'product', quantity: 1, amount, currency: 'KRW' }] : undefined,
      },
      orderId ? { event_id: orderId } : undefined,
    )
  }, [])
  return null
}
