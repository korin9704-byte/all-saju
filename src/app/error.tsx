"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-24 text-center max-w-md">
      <p className="text-xs font-mono text-mute mb-4">ERROR</p>
      <h1 className="text-xl font-semibold mb-2">오류가 발생했습니다</h1>
      <p className="text-sm text-body mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 h-10 rounded-full bg-ink text-canvas text-sm font-medium"
      >
        다시 시도
      </button>
    </div>
  );
}
