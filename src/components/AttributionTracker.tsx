'use client'
import { useEffect } from 'react'
import { ATTR_COOKIE, ATTR_MAX_AGE_DAYS, classifySource, type Attribution } from '@/lib/attribution'

/** 방문 유입 경로를 쿠키에 기록 — 첫 진입(새로고침 포함) 때만 판단, 사이트 내 이동은 무시 */
export function AttributionTracker() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      const click = p.get('ttclid') ? 'ttclid' : p.get('fbclid') ? 'fbclid' : p.get('gclid') ? 'gclid' : undefined
      const utm_source = p.get('utm_source') ?? undefined
      const ref = document.referrer
      // 카카오 로그인·토스 결제·Supabase 인증에서 돌아온 경우는 유입이 아니므로 제외
      const authReturn = /(kauth|accounts)\.kakao\.com|toss|supabase\.co/.test(ref)
      const external = !!ref && !ref.startsWith(window.location.origin) && !authReturn
      const existing = document.cookie.split('; ').some((c) => c.startsWith(`${ATTR_COOKIE}=`))

      // 광고 클릭·UTM이 있으면 항상 덮어쓰기(마지막 클릭 기준), 외부 referrer 만 있으면 기존 기록이 없을 때만
      if (!click && !utm_source && !(external && !existing)) return

      const a: Attribution = {
        source: '',
        utm_source,
        utm_medium: p.get('utm_medium') ?? undefined,
        utm_campaign: p.get('utm_campaign') ?? undefined,
        utm_content: p.get('utm_content') ?? undefined,
        click,
        landing: window.location.pathname,
        referrer: external ? ref.slice(0, 200) : undefined,
        at: new Date().toISOString(),
      }
      a.source = classifySource(a)
      const value = encodeURIComponent(JSON.stringify(a))
      document.cookie = `${ATTR_COOKIE}=${value}; path=/; max-age=${ATTR_MAX_AGE_DAYS * 86400}; samesite=lax`
    } catch {
      /* 기록 실패는 무시 — 주문은 direct 로 저장됨 */
    }
  }, [])
  return null
}
