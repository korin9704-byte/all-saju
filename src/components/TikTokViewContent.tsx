'use client'
import { useEffect } from 'react'

/** 틱톡 픽셀 — 상품 상세 조회 이벤트 (ViewContent) */
export function TikTokViewContent({ slug, name, price }: { slug: string; name: string; price: number }) {
  useEffect(() => {
    const ttq = (window as any).ttq
    ttq?.track?.('ViewContent', {
      contents: [{ content_id: slug, content_name: name, content_type: 'product', quantity: 1, price }],
      value: price,
      currency: 'KRW',
    })
  }, [slug, name, price])
  return null
}
