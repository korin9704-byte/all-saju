'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

/** 챗GPT(OpenAI) 광고 픽셀 — 기본 코드. 이벤트는 oaiq("measure", 이벤트명, 데이터, 옵션) 로 전송 */
export default function OpenAIPixel({ pixelId }: { pixelId: string }) {
  // 사이트 내 이동(새로고침 없는 화면 전환)마다 페이지 조회 전송 — 첫 진입은 초기화 직후 아래 호출이 처리
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    ;(window as any).oaiq?.('measure', 'page_viewed', { type: 'contents' })
  }, [pathname])

  return (
    <Script id="openai-pixel" strategy="afterInteractive">
      {`
        !function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
        oaiq("init",{pixelId:"${pixelId}",debug:${process.env.NODE_ENV !== "production"}});
        oaiq("measure","page_viewed",{type:"contents"});
      `}
    </Script>
  )
}
