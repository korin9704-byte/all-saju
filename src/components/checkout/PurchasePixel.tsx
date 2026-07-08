'use client'
import { useEffect } from 'react'

export function PurchasePixel({ amount }: { amount: number }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', { value: amount, currency: 'KRW' })
    }
  }, [])
  return null
}
