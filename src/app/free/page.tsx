import { redirect } from "next/navigation";

// 기존 공유 링크(/free?ref=...) 하위호환 — 사주 해설 MINI 랜딩으로 이동
export default async function FreeRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  redirect(`/free/today-fortune${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`);
}
