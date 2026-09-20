import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PurchasePixel } from "@/components/checkout/PurchasePixel";
import { ConfirmProgress } from "@/components/checkout/ConfirmProgress";

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

  return (
    <>
      <PurchasePixel amount={Number(amount)} />
      {/* 승인 대기 로딩 — /generating 과 동일한 냥이 별자리 진행 화면 */}
      <ConfirmProgress paymentKey={paymentKey} orderId={orderId} amount={Number(amount)} />
    </>
  );
}
