'use client'
import { useEffect } from 'react'

/** 광고 픽셀 — 상품 상세 조회 이벤트 (틱톡 ViewContent · 챗GPT contents_viewed) */
export function TikTokViewContent({ slug, name, price }: { slug: string; name: string; price: number }) {
  useEffect(() => {
    const w = window as any
    w.ttq?.track?.('ViewContent', {
      contents: [{ content_id: slug, content_name: name, content_type: 'product', quantity: 1, price }],
      value: price,
      currency: 'KRW',
    })
    w.oaiq?.('measure', 'contents_viewed', {
      type: 'contents',
      amount: price,
      currency: 'KRW',
      contents: [{ id: slug, name, content_type: 'product', quantity: 1, amount: price, currency: 'KRW' }],
    })
  }, [slug, name, price])
  return null
}
