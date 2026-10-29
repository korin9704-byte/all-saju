'use client'
import { useEffect } from 'react'

export function CheckoutPixel({ amount, productSlug, productName }: { amount: number; productSlug?: string; productName?: string }) {
  useEffect(() => {
    const w = window as any
    if (w.fbq) {
      w.fbq('track', 'InitiateCheckout', { value: amount, currency: 'KRW' })
    }
    // 틱톡 픽셀 — 결제 시작 (상품 정보 포함)
    w.ttq?.track?.('InitiateCheckout', {
      contents: productSlug
        ? [{ content_id: productSlug, content_name: productName, content_type: 'product', quantity: 1, price: amount }]
        : undefined,
      value: amount,
      currency: 'KRW',
    })
    // 챗GPT 픽셀 — 결제 시작
    w.oaiq?.('measure', 'checkout_started', {
      type: 'contents',
      amount,
      currency: 'KRW',
      contents: productSlug ? [{ id: productSlug, name: productName, content_type: 'product', quantity: 1, amount, currency: 'KRW' }] : undefined,
    })
  }, [])
  return null
}
