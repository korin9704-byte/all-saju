"use client";

// 재회 결과지 하단 "이어서 물어보기" — 상황 선택(필수) + 자유 입력(선택) 후 결제.
// 사주 정보와 원 결과지의 상대방·이별 상황 태그를 이어받아 후속 풀이를 정조준한다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import type { AskSaju } from "@/components/saju/AskAnotherConcern";

const MAX_DETAIL = 200;

export const REUNION_FOLLOWUP_SITUATIONS = [
  "연락했는데 답장이 없어요, 어떻게 해야 할까요?",
  "그 사람이 먼저 연락해왔는데, 어떤 의미일까요?",
  "다시 만나기로 했는데, 이번엔 잘될까요?",
  "이제 그만 놓아줘야 할까요?",
] as const;

export function AskReunionFollowup({
  productId,
  price,
  saju,
  contextTags,
  guestEmail,
  onClose,
}: {
  productId: string;
  price: number;
  saju: AskSaju;
  /** 원 결과지 saju_inputs 의 대괄호 태그([상대방]·[이별한 지] 등) — 후속 풀이 컨텍스트로 전달 */
  contextTags: string[];
  guestEmail?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [situation, setSituation] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!detail.trim()) { toast.error("질문을 입력해 주세요."); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: saju.name ?? undefined,
          birthDate: saju.birthDate,
          birthTime: saju.timeUnknown ? null : saju.birthTime,
          timeUnknown: saju.timeUnknown,
          gender: saju.gender,
          calendar: saju.calendar,
          concerns: [
            // 선택지에서 시작했으면 [상황] 태그로도 기록 (직접 입력만 했으면 질문 텍스트만)
            ...(situation ? [`[상황] ${situation}`] : []),
            ...contextTags,
            detail.trim(),
          ],
          guestEmail: guestEmail ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "주문 생성에 실패했어요.");
      router.push(`/checkout/${json.orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#F8F4FD" }}>
        <div
          className="w-full max-w-lg px-4 py-10 flex flex-col rounded-2xl overflow-hidden"
          style={{
            minHeight: "88vh",
            backgroundImage:
              "linear-gradient(rgba(248,244,253,0) 42%, rgba(248,244,253,0.8) 60%, rgba(248,244,253,0.97) 72%), url('/images/free-trouble-bg.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="mt-auto pt-24">
            <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ wordBreak: "keep-all", textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>
              더 궁금한 게 있나요?
            </h1>

            {/* 질문 선택지 — 누르면 입력란에 문구가 채워지고 자유롭게 고칠 수 있다 */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {REUNION_FOLLOWUP_SITUATIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setSituation(opt); setDetail(opt); }}
                  className={`rounded-full px-3 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
                    detail.trim() === opt
                      ? "bg-[#E7DDF8] border border-[#8F7BD6] text-[#4A3A72]"
                      : "bg-white border border-[#E7DDF8] text-body"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* 질문 입력 (필수) */}
            <div className="relative mb-8">
              <textarea
                value={detail}
                rows={4}
                onChange={(e) => setDetail(e.target.value.slice(0, MAX_DETAIL))}
                placeholder="자유롭게 질문을 남겨보세요."
                className="block w-full resize-none rounded-2xl bg-white border border-[#E7DDF8] px-5 py-4 text-sm text-[#4A3A72] leading-relaxed placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors"
              />
              <p className="absolute bottom-3 right-5 text-xs text-mute">{detail.length}/{MAX_DETAIL}자</p>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                aria-label="이전"
                onClick={onClose}
                className="w-[42px] h-[42px] shrink-0 rounded-full border border-[#E3D8F4] bg-transparent transition-colors hover:bg-[#F3EDFB] flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 4 L6 10 L12 16" stroke="#B9A8DD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                aria-label={`${formatKRW(price)} 결제하기`}
                className="w-14 h-14 shrink-0 rounded-full bg-[#DCD2F5] shadow-[0_4px_14px_rgba(143,123,214,0.3)] flex items-center justify-center transition-colors hover:bg-[#CFC0EE] disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <Spinner size={22} />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M8 4 L14 10 L8 16" stroke="#C95FC0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
