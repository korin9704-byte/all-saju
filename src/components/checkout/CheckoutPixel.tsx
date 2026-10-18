'use client'
import { useEffect } from 'react'

export function CheckoutPixel({ amount, productSlug, productName }: { amount: number; productSlug?: string; productName?: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', { value: amount, currency: 'KRW' })
    }
    // 틱톡 픽셀 — 결제 시작 (상품 정보 포함)
    ;(window as any).ttq?.track?.('InitiateCheckout', {
      contents: productSlug
        ? [{ content_id: productSlug, content_name: productName, content_type: 'product', quantity: 1, price: amount }]
        : undefined,
      value: amount,
      currency: 'KRW',
    })
  }, [])
  return null
}
