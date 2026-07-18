import { notFound, redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TossWidget } from "@/components/checkout/TossWidget";
import { CheckoutPixel } from "@/components/checkout/CheckoutPixel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKRW } from "@/lib/utils";

export const metadata = { title: "결제" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  // 유저 인증 클라이언트로 먼저 조회 (RLS: 본인 주문)
  const supabase = await createClient();
  const { data: userOrder } = await supabase
    .from("orders")
    .select("id, order_id, amount, status, user_id, guest_email, product_id, unlock_result_id")
    .eq("order_id", orderId)
    .maybeSingle();

  // 못 찾으면 서비스 클라이언트로 재시도 (게스트 주문 등)
  const service = createServiceClient();
  let order = userOrder;
  if (!order) {
    const { data: serviceOrder } = await service
      .from("orders")
      .select("id, order_id, amount, status, user_id, guest_email, product_id, unlock_result_id")
      .eq("order_id", orderId)
      .maybeSingle();
    order = serviceOrder;
  }

  if (!order) notFound();

  if (order.status === "paid") {
    if (order.unlock_result_id) redirect(`/results/${order.unlock_result_id}`);
    const { data: result } = await service
      .from("saju_results")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    if (result) redirect(`/results/${result.id}`);
  }

  const { data: product } = await service
    .from("products")
    .select("name")
    .eq("id", order.product_id)
    .single();

  const customerKey = order.user_id ?? `guest_${order.id}`;
  const email = order.guest_email;

  return (
    <div className="container py-12 max-w-2xl">
      <CheckoutPixel amount={order.amount} />
      <Card>
        <CardHeader>
          <CardTitle>결제</CardTitle>
          <CardDescription>
            {product?.name ?? "사주 상품"} · <span className="font-semibold text-foreground">{formatKRW(order.amount)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TossWidget
            orderId={order.order_id}
            amount={order.amount}
            customerKey={customerKey}
            productName={product?.name ?? "사주 상품"}
            customerEmail={email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
