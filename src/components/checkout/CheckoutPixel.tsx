'use client'
import { useEffect } from 'react'

export function CheckoutPixel({ amount }: { amount: number }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', { value: amount, currency: 'KRW' })
    }
  }, [])
  return null
}
