// 로그인·회원가입 페이지 공용 배경 잔별 (연보라 점 + 금빛 반짝이, 시차 깜빡임)
export function AuthStars() {
  return (
    <>
      <style>{`
        @keyframes loginTw { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 420 640" preserveAspectRatio="none" aria-hidden>
        <circle cx="50" cy="70" r="2.2" fill="#C9BEE0" opacity="0.8" />
        <circle cx="370" cy="100" r="1.8" fill="#C9BEE0" opacity="0.7" />
        <circle cx="140" cy="45" r="1.5" fill="#C9BEE0" opacity="0.5" />
        <circle cx="290" cy="60" r="1.5" fill="#C9BEE0" opacity="0.5" />
        <circle cx="28" cy="300" r="1.8" fill="#C9BEE0" opacity="0.6" />
        <circle cx="395" cy="280" r="1.6" fill="#C9BEE0" opacity="0.55" />
        <circle cx="60" cy="520" r="1.8" fill="#C9BEE0" opacity="0.6" />
        <circle cx="350" cy="560" r="2" fill="#C9BEE0" opacity="0.65" />
        <circle cx="210" cy="610" r="1.5" fill="#C9BEE0" opacity="0.5" />
        <path d="M80 160 l2.4 5 5.4 0.7 -3.9 3.8 0.9 5.4 -4.8 -2.6 -4.8 2.6 0.9 -5.4 -3.9 -3.8 5.4 -0.7 Z" fill="#FBE38E" stroke="#EFBE68" strokeWidth="1" style={{ animation: "loginTw 3s ease-in-out infinite" }} />
        <path d="M360 190 l2 4.2 4.6 0.6 -3.3 3.2 0.8 4.6 -4.1 -2.2 -4.1 2.2 0.8 -4.6 -3.3 -3.2 4.6 -0.6 Z" fill="#C9BEE0" opacity="0.7" style={{ animation: "loginTw 3s ease-in-out 1.5s infinite" }} />
        <path d="M55 430 l2 4.2 4.6 0.6 -3.3 3.2 0.8 4.6 -4.1 -2.2 -4.1 2.2 0.8 -4.6 -3.3 -3.2 4.6 -0.6 Z" fill="#FBE38E" stroke="#EFBE68" strokeWidth="1" opacity="0.9" style={{ animation: "loginTw 3s ease-in-out 0.8s infinite" }} />
        <path d="M380 470 l1.7 3.6 3.9 0.5 -2.8 2.7 0.7 3.9 -3.5 -1.9 -3.5 1.9 0.7 -3.9 -2.8 -2.7 3.9 -0.5 Z" fill="#C9BEE0" opacity="0.6" style={{ animation: "loginTw 3s ease-in-out 2.2s infinite" }} />
      </svg>
    </>
  );
}
