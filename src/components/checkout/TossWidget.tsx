"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadWidgets } from "@/lib/toss/client";
import { publicEnv } from "@/lib/env";

type Props = {
  orderId: string;
  amount: number;
  customerKey: string;
  productName: string;
  customerEmail: string | null;
};

export function TossWidget({ orderId, amount, customerKey, productName, customerEmail }: Props) {
  const paymentMethodsRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const widgetsRef = useRef<Awaited<ReturnType<typeof loadWidgets>> | null>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const widgets = await loadWidgets(customerKey);
      if (canceled) return;
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: amount });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#payment-methods", variantKey: "DEFAULT" }),
        widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);
      setReady(true);
    })().catch((e) => {
      toast.error(e instanceof Error ? e.message : "결제 위젯 로드 실패");
    });
    return () => {
      canceled = true;
    };
  }, [amount, customerKey]);

  async function handlePay() {
    const widgets = widgetsRef.current;
    if (!widgets) return;
    setPaying(true);
    try {
      await widgets.requestPayment({
        orderId,
        orderName: productName,
        successUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/checkout/success`,
        failUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/checkout/fail`,
        customerEmail: customerEmail ?? undefined,
      });
    } catch (err) {
      setPaying(false);
      toast.error(err instanceof Error ? err.message : "결제 요청 실패");
    }
  }

  return (
    <div className="space-y-4">
      <div id="payment-methods" ref={paymentMethodsRef} />
      <div id="agreement" ref={agreementRef} />
      <button
        type="button"
        onClick={handlePay}
        disabled={!ready || paying}
        className="w-full h-14 rounded-full bg-[#E7DDF8] text-ink text-sm font-medium transition-colors hover:bg-[#DCD2F5] disabled:opacity-50 disabled:pointer-events-none"
      >
        {paying ? (
          "결제 진행 중..."
        ) : (
          <span className="inline-flex items-center justify-center whitespace-nowrap">
            결제하기
            <span className="mx-1.5 font-normal text-[#8F7BD6]">·</span>
            <span className="text-xs font-normal text-[#8F7BD6]">불만족 시 100% 환불</span>
          </span>
        )}
      </button>
    </div>
  );
}
