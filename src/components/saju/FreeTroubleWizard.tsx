"use client";

// 무료 고민 사주 전용 단계형 입력 위저드 (/free-trouble-mx7q92)
// 디자인: 사이트 공통 입력폼 스타일 (흰 배경 + #f5f5f5 라운드 입력칸)
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const MAX_CONCERN = 200;

const STEPS = ["birth", "time", "gender", "name", "email", "concern"] as const;
type Step = typeof STEPS[number];

function clamp2(raw: string, max: number): string {
  const v = raw.replace(/\D/g, "").slice(0, 2);
  if (v.length === 2 && (parseInt(v) < 0 || parseInt(v) > max)) return v.slice(0, 1);
  return v;
}

export function FreeTroubleWizard({
  productId,
  onBack,
  mode = "free",
  askConcern = true,
  basePrice,
  bundle,
}: {
  productId: string;
  onBack?: () => void;
  /** free: 무료 생성(/generating), paid: 주문 생성 후 결제 페이지로 이동 */
  mode?: "free" | "paid";
  /** false면 고민 입력 단계 없이 이메일 단계에서 바로 결제 (사주 풀이 등 일반 풀이 상품용) */
  askConcern?: boolean;
  /** 단품 가격 (추가 상품 선택 UI 표시용) */
  basePrice?: number;
  /** 추가 상품(정통 사주) 번들 — 있으면 마지막 단계에 패키지 선택 노출 */
  bundle?: { productId: string; price: number } | null;
}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const steps: readonly Step[] = askConcern ? STEPS : STEPS.filter((s) => s !== "concern");
  const step: Step = steps[stepIdx];
  const isLastStep = stepIdx === steps.length - 1;

  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [knowsTime, setKnowsTime] = useState<boolean | null>(null);
  const timeUnknown = knowsTime === false;
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 추가 상품(정통 사주) 선택 — 번들이 있을 때만 사용
  const [withAddon, setWithAddon] = useState(false);
  const showAddon = mode === "paid" && !!bundle;

  // 무료 이용권 (리퍼럴 보상) — 보유 시 결제 대신 자동 사용 (유료 모드 전용)
  const [credit, setCredit] = useState<{ available: number } | null>(null);
  const hasCredit = mode === "paid" && (credit?.available ?? 0) > 0;

  useEffect(() => {
    if (mode !== "paid") return;
    fetch("/api/referral/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.code) setCredit(json);
      })
      .catch(() => { /* 이용권 조회 실패는 무시 */ });
  }, [mode]);

  // 입력 완료 시 자동 포커스 이동
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  const birthDate = year.length === 4 && month && day
    ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    : "";

  function isValidDate(d: string): boolean {
    const t = new Date(`${d}T00:00:00`);
    return !isNaN(t.getTime()) && t.getFullYear() >= 1900 && t <= new Date();
  }

  function next() {
    if (step === "birth") {
      if (!birthDate || !isValidDate(birthDate)) { toast.error("생년월일을 다시 확인해 주세요."); return; }
    }
    if (step === "time") {
      if (knowsTime === null) { toast.error("태어난 시간 여부를 선택해 주세요."); return; }
      if (knowsTime && (hour === "" || minute === "")) { toast.error("태어난 시간을 입력해 주세요."); return; }
    }
    if (step === "gender" && !gender) { toast.error("성별을 선택해 주세요."); return; }
    if (step === "name" && !name.trim()) { toast.error("이름 또는 닉네임을 입력해 주세요."); return; }
    if (step === "email") {
      if (!email.trim()) { toast.error("결과지를 받을 이메일을 입력해 주세요."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("이메일 형식을 다시 확인해 주세요."); return; }
      if (isLastStep) { submit(); return; }
    }
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }

  function prev() {
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    if (askConcern && !concern.trim()) { toast.error("고민을 입력해 주세요."); return; }
    const payload = {
      // 추가 상품(정통 사주) 선택 시 번들 상품으로 주문
      productId: withAddon && bundle ? bundle.productId : productId,
      name: name.trim(),
      birthDate,
      birthTime: timeUnknown ? null : `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
      timeUnknown,
      gender,
      calendar,
      concerns: concern.trim() ? [concern.trim()] : [],
      guestEmail: email.trim(),
    };

    // 유료 + 무료 이용권 보유: 결제 대신 이용권으로 즉시 결과 생성 (번들 선택 시엔 일반 결제)
    if (mode === "paid" && hasCredit && !withAddon) {
      try {
        sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "redeem", payload }));
      } catch { /* ignore */ }
      setSubmitting(true);
      router.push("/generating");
      return;
    }

    // 유료: 주문 생성 → 결제 페이지
    if (mode === "paid") {
      if (submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "주문 생성에 실패했어요.");
        router.push(`/checkout/${json.orderId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "오류가 발생했어요.");
        setSubmitting(false);
      }
      return;
    }

    // 무료: 결과 생성 페이지로 이동
    try {
      sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "free-trouble", payload }));
    } catch { /* ignore */ }
    setSubmitting(true);
    router.push("/generating");
  }

  const numInputCls = "w-full bg-white border border-[#E7DDF8] rounded-2xl px-4 py-3 text-sm text-[#4A3A72] text-center placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors disabled:opacity-40";
  const textInputCls = "w-full bg-white border border-[#E7DDF8] rounded-2xl px-4 py-3 text-sm text-[#4A3A72] placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors";
  const nextBtnCls = "flex-1 h-14 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none";
  const nextBtnStyle = { background: "linear-gradient(90deg, #8F7BD6, #C95FC0)" };
  const prevBtnCls = "w-24 h-14 rounded-full bg-white border border-[#E7DDF8] text-[#4A3A72] text-sm font-medium transition-colors hover:bg-[#F3EDFB]";

  const radioRow = (selected: boolean, label: string, onClick: () => void, key?: string) => (
    <label key={key ?? label}
      className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${selected ? "bg-[#E7DDF8] border border-[#8F7BD6]" : "bg-white border border-[#E7DDF8]"}`}>
      <input type="radio" checked={selected} onChange={onClick} className="w-4 h-4 accent-[#7761C8]" />
      <span className="text-sm text-[#4A3A72]">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#F8F4FD" }}>
      <div
        className="w-full max-w-lg px-4 py-10 flex flex-col rounded-2xl overflow-hidden"
        style={{
          minHeight: "88vh",
          backgroundImage: "linear-gradient(rgba(248,244,253,0) 42%, rgba(248,244,253,0.8) 60%, rgba(248,244,253,0.97) 72%), url('/images/free-trouble-bg.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* 진행 표시 */}
        <div className="flex justify-center gap-2 pt-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === stepIdx ? 34 : 18,
                backgroundColor: i === stepIdx ? "#8F7BD6" : "#E7DDF8",
              }}
            />
          ))}
        </div>

        {/* 본문 (하단 정렬 — 상단은 배경 그림 노출) */}
        <div className="mt-auto pt-96">
          {step === "birth" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>태어난 날이 언제인가요?</h1>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {radioRow(calendar === "solar", "양력", () => setCalendar("solar"), "solar")}
                {radioRow(calendar === "lunar", "음력", () => setCalendar("lunar"), "lunar")}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-8">
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={4} value={year} placeholder="1990"
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setYear(v); if (v.length === 4) monthRef.current?.focus(); }} className={`${numInputCls} pr-8`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">년</span>
                </div>
                <div className="relative">
                  <input ref={monthRef} type="text" inputMode="numeric" maxLength={2} value={month} placeholder="05"
                    onChange={(e) => { const v = clamp2(e.target.value, 12); setMonth(v); if (v.length === 2) dayRef.current?.focus(); }} className={`${numInputCls} pr-6`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">월</span>
                </div>
                <div className="relative">
                  <input ref={dayRef} type="text" inputMode="numeric" maxLength={2} value={day} placeholder="15"
                    onChange={(e) => setDay(clamp2(e.target.value, 31))} className={`${numInputCls} pr-6`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">일</span>
                </div>
              </div>
              <div className="flex gap-3">
                {onBack && (
                  <button type="button" onClick={onBack} className={prevBtnCls}>이전</button>
                )}
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle}>다음</button>
              </div>
            </>
          )}

          {step === "time" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>태어난 시간을 아시나요?</h1>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {radioRow(knowsTime === true, "예", () => setKnowsTime(true), "yes")}
                {radioRow(knowsTime === false, "아니오", () => setKnowsTime(false), "no")}
              </div>
              {knowsTime === true && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="relative">
                    <input type="text" inputMode="numeric" maxLength={2} value={hour} placeholder="14"
                      onChange={(e) => { const v = clamp2(e.target.value, 23); setHour(v); if (v.length === 2) minuteRef.current?.focus(); }} className={`${numInputCls} pr-8`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">시</span>
                  </div>
                  <div className="relative">
                    <input ref={minuteRef} type="text" inputMode="numeric" maxLength={2} value={minute} placeholder="30"
                      onChange={(e) => setMinute(clamp2(e.target.value, 59))} className={`${numInputCls} pr-8`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">분</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle}>다음</button>
              </div>
            </>
          )}

          {step === "gender" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>성별을 알려주세요.</h1>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {radioRow(gender === "female", "여자", () => setGender("female"), "female")}
                {radioRow(gender === "male", "남자", () => setGender("male"), "male")}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle}>다음</button>
              </div>
            </>
          )}

          {step === "name" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>이름을 알려주세요.</h1>
              <input value={name} maxLength={10}
                onChange={(e) => setName(e.target.value)}
                placeholder="풀이에서 이렇게 불러드릴게요."
                className={`${textInputCls} mb-8`} />
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle}>다음</button>
              </div>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>이메일을 알려주세요.</h1>
              <input type="email" value={email} placeholder="결과지를 보내드려요."
                onChange={(e) => setEmail(e.target.value)}
                className={`${textInputCls} mb-8`} />
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} disabled={submitting} className={nextBtnCls} style={nextBtnStyle}>
                  {!isLastStep
                    ? "다음"
                    : submitting
                      ? "잠시만요..."
                      : hasCredit
                        ? "무료 이용권으로 결과보기"
                        : mode === "paid"
                          ? "결제하기 · 불만족 시 100% 환불"
                          : "결제하기"}
                </button>
              </div>
            </>
          )}

          {step === "concern" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>어떤 고민이 있으세요?</h1>
              <div className="relative mb-8">
                <textarea value={concern} rows={6}
                  onChange={(e) => setConcern(e.target.value.slice(0, MAX_CONCERN))}
                  placeholder="지금 마음에 걸리는 고민을 자유롭게 작성해 주세요."
                  className="block w-full resize-none rounded-2xl bg-white border border-[#E7DDF8] px-5 py-4 text-sm text-[#4A3A72] leading-relaxed placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors" />
                <p className="absolute bottom-4 right-5 text-xs text-mute">{concern.length}/{MAX_CONCERN}자</p>
              </div>

              {/* 추가 상품(정통 사주) 패키지 선택 */}
              {showAddon && bundle && (
                <div className="mb-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => setWithAddon(false)}
                    className={`w-full rounded-2xl px-5 py-4 text-left transition-colors ${!withAddon ? "bg-[#E7DDF8] border border-[#8F7BD6]" : "bg-white border border-[#E7DDF8]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#4A3A72]">고민 사주</span>
                      <span className="text-sm font-medium text-[#4A3A72]">{(basePrice ?? 3900).toLocaleString()}원</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithAddon(true)}
                    className={`w-full rounded-2xl px-5 py-4 text-left transition-colors ${withAddon ? "bg-[#E7DDF8] border border-[#8F7BD6]" : "bg-white border border-[#E7DDF8]"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#4A3A72]">고민 사주 + 정통 사주</span>
                      <span className="text-right">
                        <span className="block text-xs text-mute line-through">{(bundle.price + 5000).toLocaleString()}원</span>
                        <span className="block text-sm font-medium text-[#4A3A72]">{bundle.price.toLocaleString()}원</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#C95FC0]">정통 사주 5,000원 할인</p>
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={submit} disabled={submitting} className={nextBtnCls} style={nextBtnStyle}>
                  {submitting
                    ? "잠시만요..."
                    : hasCredit && !withAddon
                      ? "무료 이용권으로 결과보기"
                      : mode === "paid"
                        ? "결제하기 · 불만족 시 100% 환불"
                        : "결제하기"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
