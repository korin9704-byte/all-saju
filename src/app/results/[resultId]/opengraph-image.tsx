// 결과지 카톡/SNS 미리보기 카드 (동적 OG 이미지)
import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "사주 결과지 미리보기";

// 구글 폰트에서 필요한 글자만 서브셋으로 로드 (한글 전체 폰트는 너무 큼)
async function loadGoogleFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!resource) return null;
    return await (await fetch(resource[1])).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;

  let who = "나의";
  let productName = "사주 결과지";
  let quote = "3분 만에 보는 내 사주";

  try {
    const service = createServiceClient();
    const { data: result } = await service
      .from("saju_results")
      .select("interpretation_md, order_id")
      .eq("id", resultId)
      .maybeSingle();
    if (result) {
      const { data: order } = await service
        .from("orders")
        .select("product_id")
        .eq("id", result.order_id)
        .maybeSingle();
      const { data: product } = order
        ? await service.from("products").select("name").eq("id", order.product_id).maybeSingle()
        : { data: null };
      const { data: input } = await service
        .from("saju_inputs")
        .select("name")
        .eq("order_id", result.order_id)
        .maybeSingle();

      if (input?.name) who = `${input.name}님의`;
      if (product?.name) productName = product.name;
      const firstTitle = result.interpretation_md.match(/^## (.+)$/m)?.[1]?.trim();
      if (firstTitle) quote = firstTitle;
    }
  } catch {
    // 조회 실패 시 기본 문구로 렌더
  }

  const header = `${who} ${productName}`;
  const footer = "냥점 · 3분 만에 보는 무료 사주";
  const fontData = await loadGoogleFont(`${header}“${quote}”${footer}🐾`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: "72px 80px",
          fontFamily: "NotoSansKR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 40, color: "#FEE500", fontWeight: 700 }}>🐾 냥점</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 44, color: "#bbbbbb", fontWeight: 700 }}>{header}</div>
          <div
            style={{
              fontSize: 60,
              color: "#ffffff",
              fontWeight: 700,
              lineHeight: 1.35,
              wordBreak: "keep-all",
            }}
          >
            {`“${quote}”`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 30, color: "#888888", fontWeight: 700 }}>{footer}</div>
          <div
            style={{
              fontSize: 30,
              color: "#191919",
              fontWeight: 700,
              background: "#FEE500",
              padding: "16px 32px",
              borderRadius: 999,
            }}
          >
            나도 무료로 보기
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoSansKR", data: fontData, style: "normal" as const, weight: 700 as const }]
        : undefined,
    },
  );
}
