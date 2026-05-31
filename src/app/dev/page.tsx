"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRODUCTS = [
  { slug: "today-fortune", name: "사주 해설" },
  { slug: "premium-saju",  name: "대운 해설" },
  { slug: "love-saju",     name: "궁합 해설" },
  { slug: "worry-saju",    name: "무엇이든 물어보세요" },
];

export default function DevPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(slug: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dev/test-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "실패");
      router.push(`/results/${json.resultId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
      setLoading(false);
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <div className="mb-8">
        <p className="text-xs font-mono text-pink-500 mb-1">DEV ONLY</p>
        <h1 className="text-2xl font-bold">결제 없이 결과 테스트</h1>
        <p className="text-sm text-gray-500 mt-1">
          테스트 생년월일(1990.03.15 / 여성)로 LLM 결과를 생성해요.
          <br />
          시간이 30~90초 걸릴 수 있어요.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-3xl mb-3 animate-pulse">🔮</div>
          <p className="text-sm font-medium text-gray-700">결과 생성 중...</p>
          <p className="text-xs text-gray-400 mt-1">LLM이 사주를 해석하고 있어요. 잠시 기다려주세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {PRODUCTS.map((p) => (
            <button
              key={p.slug}
              onClick={() => generate(p.slug)}
              className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-[#E91E8C] transition-colors shadow-sm"
            >
              <p className="font-semibold text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.slug}</p>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">오류 발생</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
