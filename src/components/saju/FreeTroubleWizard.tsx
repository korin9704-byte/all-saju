"use client";

// 무료 고민 사주 전용 단계형 입력 위저드 (/free-trouble-mx7q92)
// 디자인: 사이트 공통 입력폼 스타일 (흰 배경 + #f5f5f5 라운드 입력칸)
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const MAX_CONCERN = 200;

const STEPS = ["birth", "time", "gender", "name", "job", "love", "email", "concern"] as const;
type Step = typeof STEPS[number];

const JOB_OPTIONS = ["직장인", "사업·자영업", "취업 준비중", "학생", "주부", "기타"] as const;
const LOVE_OPTIONS = ["솔로", "연애중", "기혼"] as const;

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
  askJob = false,
  basePrice,
  bundle,
}: {
  productId: string;
  onBack?: () => void;
  /** free: 무료 생성(/generating), paid: 주문 생성 후 결제 페이지로 이동 */
  mode?: "free" | "paid";
  /** false면 고민 입력 단계 없이 이메일 단계에서 바로 결제 (사주 풀이 등 일반 풀이 상품용) */
  askConcern?: boolean;
  /** true면 이름 뒤에 직업 선택 단계 추가 (인생 사주 — 직업운·재물운 맞춤용) */
  askJob?: boolean;
  /** 단품 가격 (추가 상품 선택 UI 표시용) */
  basePrice?: number;
  /** 추가 상품(정통 사주) 번들 — 있으면 마지막 단계에 패키지 선택 노출 */
  bundle?: { productId: string; price: number } | null;
}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const steps: readonly Step[] = STEPS.filter(
    (s) => (askConcern || s !== "concern") && (askJob || (s !== "job" && s !== "love")),
  );
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
  const [job, setJob] = useState<string | null>(null);
  const [love, setLove] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 추가 상품(정통 사주) 선택 — 번들이 있을 때만 사용
  const [withAddon, setWithAddon] = useState(false);
  // 결제하기 클릭 시 상품 선택 바텀 시트 노출
  const [sheetOpen, setSheetOpen] = useState(false);
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
    if (step === "job" && !job) { toast.error("지금 하시는 일을 선택해 주세요."); return; }
    if (step === "love" && !love) { toast.error("연애 상태를 선택해 주세요."); return; }
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
    // 번들 선택 시 직업·연애 상태 필수
    if (showAddon && withAddon && (!job || !love)) { toast.error("직업·연애 상태를 선택해 주세요."); return; }
    const payload = {
      // 추가 상품(정통 사주) 선택 시 번들 상품으로 주문
      productId: withAddon && bundle ? bundle.productId : productId,
      name: name.trim(),
      birthDate,
      birthTime: timeUnknown ? null : `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
      timeUnknown,
      gender,
      calendar,
      concerns: [
        ...((askJob || withAddon) && job ? [`[직업] ${job}`] : []),
        ...((askJob || withAddon) && love ? [`[연애] ${love}`] : []),
        ...(concern.trim() ? [concern.trim()] : []),
      ],
      guestEmail: email.trim(),
    };

    // 유료 + 무료 이용권 보유: 결제 대신 이용권으로 즉시 결과 생성 (번들 포함)
    if (mode === "paid" && hasCredit) {
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

  const numInputCls = "w-full bg-white border border-[#E7DDF8] rounded-full px-4 py-3 text-sm text-[#4A3A72] text-center placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors disabled:opacity-40";
  const textInputCls = "w-full bg-white border border-[#E7DDF8] rounded-full px-5 py-3 text-sm text-[#4A3A72] placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors";
  // 원형 셰브론 이전(<)·다음(>) 버튼 나란히 + 마지막 단계만 넓은 플랫 알약
  const circleBtnCls = "w-14 h-14 shrink-0 rounded-full bg-[#F3EDFB] transition-colors hover:bg-[#E7DDF8] flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none";
  const nextBtnCls = "h-14 shrink-0 rounded-full bg-[#DCD2F5] px-7 flex items-center justify-center gap-1.5 text-sm text-[#4A3A72] font-medium transition-colors hover:bg-[#CFC0EE] disabled:opacity-50 disabled:pointer-events-none";
  const nextWideCls = "h-14 rounded-full bg-[#DCD2F5] px-10 text-[#4A3A72] text-sm font-medium transition-colors hover:bg-[#CFC0EE] disabled:opacity-50 disabled:pointer-events-none";
  const nextBtnStyle = {};
  const prevBtnCls = circleBtnCls;
  const prevIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 4 L6 10 L12 16" stroke="#7A6B9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const radioRow = (selected: boolean, label: string, onClick: () => void, key?: string) => (
    <label key={key ?? label}
      className={`flex items-center gap-3 cursor-pointer rounded-full px-4 py-3 transition-colors ${selected ? "bg-[#E7DDF8] border border-[#8F7BD6]" : "bg-white border border-[#E7DDF8]"}`}>
      <input type="radio" checked={selected} onChange={onClick} className="w-4 h-4 accent-[#7761C8]" />
      <span className="text-sm text-[#4A3A72] whitespace-nowrap">{label}</span>
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
              <div className="flex gap-3 justify-center">
                {onBack && (
                  <button type="button" onClick={onBack} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                )}
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">다음</button>
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
              <div className="flex gap-3 justify-center mt-8">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">다음</button>
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
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">다음</button>
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
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">다음</button>
              </div>
            </>
          )}

          {step === "job" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>어떤 일을 하고 있나요?</h1>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {JOB_OPTIONS.map((opt) => radioRow(job === opt, opt, () => setJob(opt), opt))}
              </div>
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">다음</button>
              </div>
            </>
          )}

          {step === "love" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>지금 연애하고 있나요?</h1>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {LOVE_OPTIONS.map((opt) => radioRow(love === opt, opt, () => setLove(opt), opt))}
              </div>
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">다음</button>
              </div>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>이메일을 알려주세요.</h1>
              <input type="email" value={email} placeholder="결과지를 보내드려요."
                onChange={(e) => setEmail(e.target.value)}
                className={`${textInputCls} mb-8`} />
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} disabled={submitting} className={isLastStep ? nextWideCls : nextBtnCls} style={nextBtnStyle} aria-label="다음">
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
                  className="block w-full resize-none rounded-[28px] bg-white border border-[#E7DDF8] px-6 py-5 text-sm text-[#4A3A72] leading-relaxed placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors" />
                <p className="absolute bottom-4 right-5 text-xs text-mute">{concern.length}/{MAX_CONCERN}자</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button
                  type="button"
                  onClick={() => {
                    if (showAddon) {
                      if (!concern.trim()) { toast.error("고민을 입력해 주세요."); return; }
                      setSheetOpen(true);
                      return;
                    }
                    submit();
                  }}
                  disabled={submitting}
                  className={nextWideCls}
                  style={nextBtnStyle}
                >
                  {submitting
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
        </div>
      </div>

      {/* 상품 선택 바텀 시트 — 결제하기 클릭 시 노출 */}
      {sheetOpen && bundle && (
        <div className="fixed inset-0 z-[60]">
          <style>{`
            @keyframes paySheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes payBackdropIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
          <div className="mx-auto w-full max-w-lg h-full relative overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40"
              style={{ animation: "payBackdropIn 0.2s ease-out" }}
              onClick={() => setSheetOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[#F8F4FD] px-4 pb-6"
              style={{ animation: "paySheetUp 0.25s ease-out", boxShadow: "0 -8px 32px rgba(74,58,114,0.18)" }}
            >
              {/* 핸들 바 */}
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSheetOpen(false)}
                className="flex w-full justify-center pt-3 pb-3"
              >
                <span className="h-1.5 w-10 rounded-full bg-[#D8CCEE]" />
              </button>

              {/* auto-rows-fr — 두 카드 높이 동일 */}
              <div className="grid auto-rows-fr gap-3">
                <button
                  type="button"
                  onClick={() => setWithAddon(false)}
                  className={`w-full rounded-2xl px-5 py-4 text-left transition-colors flex flex-col justify-center ${!withAddon ? "bg-[#E7DDF8] border border-[#8F7BD6]" : "bg-white border border-[#E7DDF8]"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-[#4A3A72]">고민 사주</span>
                    <span className="text-sm font-medium text-[#4A3A72]">{(basePrice ?? 3900).toLocaleString()}원</span>
                  </div>
                  <p className="mt-1 text-xs text-body">내 고민에 정조준한 맞춤 풀이.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setWithAddon(true)}
                  className={`w-full rounded-2xl px-5 py-4 text-left transition-colors flex flex-col justify-center ${withAddon ? "bg-[#E7DDF8] border border-[#8F7BD6]" : "bg-white border border-[#E7DDF8]"}`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[#4A3A72]">
                        고민 사주 + 인생 사주
                        {/* 도장 찍힌 느낌의 스탬프 배지 */}
                        <span
                          className="shrink-0 relative -top-[4.25px] rounded px-1.5 py-0.5 text-[11px] font-medium text-[#C95FC0] border-[1.5px] border-[#C95FC0] -rotate-[4deg]"
                          style={{ outline: "1px solid #F2D3EF", outlineOffset: 2 }}
                        >
                          9할이 선택
                        </span>
                      </span>
                      <span className="mt-1 text-xs font-normal text-body">고민 맞춤 풀이 + 인생 전체를 13개의 장에 담은 8만 자 분량의 리포트.</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs text-[#C95FC0]">50% 할인</span>
                      <span className="block text-xs text-mute line-through">{(bundle.price * 2).toLocaleString()}원</span>
                      <span className="block text-sm font-medium text-[#4A3A72]">{bundle.price.toLocaleString()}원</span>
                    </span>
                  </div>
                </button>
              </div>

              {/* 번들 선택 시 — 직업·연애 상태 질문 */}
              {withAddon && (
                <div className="mt-3 rounded-2xl bg-white border border-[#E7DDF8] px-5 py-4">
                  <p className="flex items-center gap-1.5 text-[13px] text-[#4A3A72] mb-2 pl-1">
                    <span className="w-1.5 h-1.5 bg-[#8F7BD6] rotate-45 rounded-[1px]" aria-hidden />
                    어떤 일을 하고 있나요?
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {JOB_OPTIONS.map((opt) => (
                      <button key={opt} type="button" onClick={() => setJob(opt)}
                        className={`rounded-full px-2 py-2.5 text-[13px] whitespace-nowrap transition-colors ${job === opt ? "bg-[#E7DDF8] border border-[#8F7BD6] text-[#4A3A72]" : "bg-[#FBF9FE] border border-[#E7DDF8] text-body"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <p className="flex items-center gap-1.5 text-[13px] text-[#4A3A72] mb-2 pl-1">
                    <span className="w-1.5 h-1.5 bg-[#8F7BD6] rotate-45 rounded-[1px]" aria-hidden />
                    지금 연애하고 있나요?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {LOVE_OPTIONS.map((opt) => (
                      <button key={opt} type="button" onClick={() => setLove(opt)}
                        className={`rounded-full px-2 py-2.5 text-[13px] whitespace-nowrap transition-colors ${love === opt ? "bg-[#E7DDF8] border border-[#8F7BD6] text-[#4A3A72]" : "bg-[#FBF9FE] border border-[#E7DDF8] text-body"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full mt-5 h-14 rounded-full bg-[#DCD2F5] text-sm text-[#4A3A72] font-medium transition-colors hover:bg-[#CFC0EE] disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting
                  ? "잠시만요..."
                  : hasCredit
                    ? "무료 이용권으로 결과보기"
                    : "결제하기 · 불만족 시 100% 환불"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
