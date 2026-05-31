"use client";

import dynamic from "next/dynamic";

export const SajuFormNoSSR = dynamic(
  () => import("@/components/saju/SajuForm").then((m) => m.SajuForm),
  { ssr: false, loading: () => <div className="h-40" /> }
);
