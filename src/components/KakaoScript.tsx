"use client";

// 카카오 JS SDK 로더 — 카카오톡 공유(Share)용. NEXT_PUBLIC_KAKAO_JS_KEY 가 있어야 동작한다.
import Script from "next/script";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (settings: {
          objectType: "feed";
          content: {
            title: string;
            description?: string;
            imageUrl: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons?: { title: string; link: { mobileWebUrl: string; webUrl: string } }[];
        }) => void;
      };
    };
  }
}

export function KakaoScript() {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) return null;
  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(key);
      }}
    />
  );
}
