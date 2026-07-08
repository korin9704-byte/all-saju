import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;

  if (!paymentKey || !orderId || !amount) {
    return (
      <div className="container py-16 max-w-md text-center">
        <p className="text-sm font-mono text-mute mb-2">ERROR</p>
        <h1 className="text-xl font-semibold mb-2">필수 파라미터가 누락되었습니다.</h1>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>홈으로</Link>
      </div>
    );
  }

  const confirmPayload = JSON.stringify({
    paymentKey,
    orderId,
    amount: Number(amount),
  });

  return (
    <>
      <style>{`
        @keyframes fadeScroll {
          0%   { opacity: 0; transform: translateY(6px); }
          15%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        .saju-col span { animation: fadeScroll 3s ease-in-out infinite; display: block; }
        .saju-col:nth-child(1) span { animation-delay: 0s; }
        .saju-col:nth-child(2) span { animation-delay: 0.6s; }
        .saju-col:nth-child(3) span { animation-delay: 1.2s; }
        .saju-col:nth-child(4) span { animation-delay: 1.8s; }
        @keyframes barPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        #progress-fill { transition: width 1s linear; animation: barPulse 2s ease-in-out infinite; }
      `}</style>

      <div className="container py-16 max-w-sm text-center" id="loading-view">

        {/* 메인 메시지 */}
        <h1 className="text-lg font-bold text-ink leading-snug mb-6" id="loading-msg">
          행운의 냥이가 노이즈 캔슬링 켜고<br />집중해서 분석 중...🐾
        </h1>

        {/* 프로그레스 바 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">🐱</div>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              id="progress-fill"
              className="h-full rounded-full"
              style={{ width: "2%", background: "linear-gradient(90deg, #f59e0b, #f43f5e)" }}
            />
          </div>
          <span id="progress-pct" className="text-sm font-mono text-muted-foreground w-8 text-right">2%</span>
        </div>

        {/* 남은 시간 */}
        <p className="text-sm text-muted-foreground mb-2">
          예상 남은 시간: 약 <span id="countdown">90</span>초
        </p>
        <p className="text-xs text-muted-foreground">잠시만 기다려주세요...</p>
      </div>

      {/* 에러 UI */}
      <div id="error-view" className="container py-16 max-w-md text-center" style={{ display: "none" }}>
        <p className="text-sm font-mono text-mute mb-2">ERROR</p>
        <h1 className="text-xl font-semibold mb-2">결제 처리 실패</h1>
        <p id="error-msg" className="text-sm text-body mb-6" />
        <Link href="/mypage" className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>마이페이지</Link>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var pct = 2;
  var seconds = 90;
  var done = false;

  var sajuTerms = [
    ["진인반합","신자진삼합","임계수","갑목"],
    ["신자진삼합→수","진인반합","천을귀인","편재"],
    ["공망","자신반합","신자진삼합→수","식신"],
    ["신자진삼합→수","자신반합","백호대살","정관"],
  ];
  var termIdx = [0,0,0,0];

  function updateTerms() {
    for (var i = 0; i < 4; i++) {
      termIdx[i] = (termIdx[i] + 1) % sajuTerms[i].length;
      var el = document.getElementById('col' + i);
      if (el) el.textContent = sajuTerms[i][termIdx[i]];
    }
  }
  setInterval(updateTerms, 3000);

  var timer = setInterval(function() {
    if (done) return;
    if (seconds > 0) seconds--;
    var el = document.getElementById('countdown');
    if (el) el.textContent = seconds;

    // 진행률: 처음엔 빠르게, 나중엔 느리게
    if (pct < 90) {
      var inc = pct < 30 ? 2 : pct < 60 ? 1 : 0.3;
      pct = Math.min(90, pct + inc);
    }
    var fill = document.getElementById('progress-fill');
    var pctEl = document.getElementById('progress-pct');
    if (fill) fill.style.width = pct.toFixed(0) + '%';
    if (pctEl) pctEl.textContent = pct.toFixed(0) + '%';
  }, 1000);

  fetch('/api/orders/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: ${JSON.stringify(confirmPayload)},
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    done = true;
    clearInterval(timer);
    if (res.ok) {
      if (window.fbq) { window.fbq('track', 'Purchase', { value: ${amount}, currency: 'KRW' }); }
    }
    if (res.ok && res.data.resultId) {
      var fill = document.getElementById('progress-fill');
      var pctEl = document.getElementById('progress-pct');
      var msg = document.getElementById('loading-msg');
      if (fill) fill.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      if (msg) msg.innerHTML = '분석 완료! 결과 페이지로 이동할게요 🐾';
      setTimeout(function() {
        window.location.href = '/results/' + res.data.resultId;
      }, 600);
    } else {
      document.getElementById('loading-view').style.display = 'none';
      document.getElementById('error-view').style.display = 'block';
      document.getElementById('error-msg').textContent = res.data.error || '결제 승인에 실패했어요.';
    }
  })
  .catch(function() {
    done = true;
    clearInterval(timer);
    document.getElementById('loading-view').style.display = 'none';
    document.getElementById('error-view').style.display = 'block';
    document.getElementById('error-msg').textContent = '결제 승인 중 오류가 발생했어요.';
  });
})();
          `,
        }}
      />
    </>
  );
}
