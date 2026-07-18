"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const PENDING_KEY = "freemini_pending";
const REF_KEY = "saju_ref";

type Payload = {
  name?: string;
  birthDate: string;
  birthTime: string | null;
  timeUnknown: boolean;
  gender: "male" | "female";
  calendar: "solar" | "lunar";
};

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <label
      className={`inline-flex items-center px-5 py-2.5 rounded-full border-2 text-sm cursor-pointer whitespace-nowrap transition-colors ${
        selected
          ? "bg-[#000000] border-[#000000] text-white"
          : "bg-transparent border-[#e5e5e5] text-black hover:border-black"
      }`}
    >
      <input type="radio" className="sr-only" checked={selected} onChange={onClick} />
      {label}
    </label>
  );
}

export function FreeMiniForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Suspense>
      <FreeMiniFormInner isLoggedIn={isLoggedIn} />
    </Suspense>
  );
}

function FreeMiniFormInner({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const refParam = search.get("ref");
  const resume = search.get("resume") === "1";

  const [name, setName]               = useState("");
  const [birthYear, setBirthYear]     = useState("");
  const [birthMonth, setBirthMonth]   = useState("");
  const [birthDay, setBirthDay]       = useState("");
  const [birthTime, setBirthTime]     = useState("");
  const [timeUnknown, setTimeUnknown] = useState<boolean | null>(null);
  const [gender, setGender]           = useState<"male" | "female" | null>(null);
  const [calendar, setCalendar]       = useState<"solar" | "lunar" | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const birthDate = birthYear.length === 4 && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
    : "";

  // 공유 링크의 추천 코드 저장 (로그인 왕복에도 유지되도록 localStorage)
  useEffect(() => {
    if (refParam) {
      try { localStorage.setItem(REF_KEY, refParam); } catch { /* ignore */ }
    }
  }, [refParam]);

  const requestMini = useCallback(async (payload: Payload) => {
    setSubmitting(true);
    try {
      let ref: string | undefined;
      try { ref = localStorage.getItem(REF_KEY) ?? undefined; } catch { /* ignore */ }

      const res = await fetch("/api/free-mini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ref }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "미니 사주 생성 실패");
      if (json.already) toast.info("이미 무료 미니 사주를 보셨어요. 결과로 이동할게요");
      router.push(`/results/${json.resultId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했어요");
      setSubmitting(false);
    }
  }, [router]);

  // 카카오 로그인에서 돌아온 경우: 저장해둔 입력으로 자동 이어서 진행
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!resume || !isLoggedIn || resumedRef.current) return;
    resumedRef.current = true;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_KEY);
      const payload = JSON.parse(raw) as Payload;
      toast.info("로그인 완료! 결과를 만들고 있어요");
      void requestMini(payload);
    } catch { /* ignore */ }
  }, [resume, isLoggedIn, requestMini]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!birthDate) { toast.error("생년월일을 입력해 주세요"); return; }
    if (!calendar) { toast.error("달력 종류를 선택해 주세요"); return; }
    if (!gender) { toast.error("성별을 선택해 주세요"); return; }
    if (timeUnknown === null) { toast.error("태어난 시간 여부를 선택해 주세요"); return; }

    const payload: Payload = {
      name: name.trim() || undefined,
      birthDate,
      birthTime: timeUnknown ? null : birthTime
        ? birthTime.split(":").map((v) => v.padStart(2, "0")).join(":")
        : null,
      timeUnknown,
      gender,
      calendar,
    };

    if (!isLoggedIn) {
      // 입력을 저장해두고 카카오 1초 로그인 후 자동으로 이어서 진행
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
      setSubmitting(true);
      const supabase = createClient();
      const next = `/free?resume=1${refParam ? `&ref=${encodeURIComponent(refParam)}` : ""}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          scopes: "account_email profile_nickname",
        },
      });
      if (error) {
        setSubmitting(false);
        toast.error("카카오 로그인을 시작할 수 없어요. 잠시 후 다시 시도해 주세요");
      }
      return;
    }

    await requestMini(payload);
  }

  const inputCls = "w-full rounded-xl border-2 border-[#e5e5e5] px-4 py-2.5 text-sm focus:border-black focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-base font-bold text-ink mb-2">이름 (선택)</p>
        <input
          className={inputCls}
          value={name}
          maxLength={20}
          placeholder="이름"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <p className="text-base font-bold text-ink mb-2">생년월일</p>
        <div className="grid grid-cols-3 gap-2">
          <input className={inputCls} inputMode="numeric" maxLength={4} placeholder="1996"
            value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ""))} />
          <input className={inputCls} inputMode="numeric" maxLength={2} placeholder="7"
            value={birthMonth} onChange={(e) => setBirthMonth(e.target.value.replace(/\D/g, ""))} />
          <input className={inputCls} inputMode="numeric" maxLength={2} placeholder="14"
            value={birthDay} onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="flex gap-2 mt-3">
          <Chip label="양력" selected={calendar === "solar"} onClick={() => setCalendar("solar")} />
          <Chip label="음력" selected={calendar === "lunar"} onClick={() => setCalendar("lunar")} />
        </div>
      </div>

      <div>
        <p className="text-base font-bold text-ink mb-2">태어난 시간</p>
        <div className="flex flex-wrap items-center gap-2">
          <Chip label="시간 알아요" selected={timeUnknown === false} onClick={() => setTimeUnknown(false)} />
          <Chip label="시간 몰라요" selected={timeUnknown === true} onClick={() => setTimeUnknown(true)} />
        </div>
        {timeUnknown === false && (
          <input type="time" className={`${inputCls} mt-3`} value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)} />
        )}
      </div>

      <div>
        <p className="text-base font-bold text-ink mb-2">성별</p>
        <div className="flex gap-2">
          <Chip label="여성" selected={gender === "female"} onClick={() => setGender("female")} />
          <Chip label="남성" selected={gender === "male"} onClick={() => setGender("male")} />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "#FEE500", color: "#191919" }}
      >
        {submitting
          ? "결과를 만들고 있어요..."
          : isLoggedIn
            ? "무료로 결과보기"
            : "카카오 1초 로그인하고 무료로 결과보기"}
      </button>
      {!isLoggedIn && (
        <p className="text-xs text-center text-muted-foreground">
          결과 저장을 위해 카카오 로그인이 필요해요 · 결제 없음
          <br />
          로그인 시 <a href="/legal/terms" className="underline" target="_blank">이용약관</a>과{" "}
          <a href="/legal/privacy" className="underline" target="_blank">개인정보처리방침</a>에 동의하게 됩니다
        </p>
      )}
    </form>
  );
}
