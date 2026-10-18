'use client'
import { useEffect } from 'react'

export function PurchasePixel({ amount, orderId, productSlug, productName }: { amount: number; orderId?: string; productSlug?: string; productName?: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', { value: amount, currency: 'KRW' })
    }
    // 틱톡 픽셀 — 결제 완료 (상품 정보 포함, event_id = 주문번호: 추후 이벤트 API 중복 제거용)
    ;(window as any).ttq?.track?.(
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
  }, [])
  return null
}
