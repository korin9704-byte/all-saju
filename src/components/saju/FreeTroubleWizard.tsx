"use client";

// 무료 고민 사주 전용 단계형 입력 위저드 (/free-trouble-mx7q92)
// 디자인: 사이트 공통 입력폼 스타일 (흰 배경 + #f5f5f5 라운드 입력칸)
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const MAX_CONCERN = 200;

const STEPS = ["birth", "time", "gender", "name", "job", "love", "email", "partner", "concern", "product"] as const;
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
  askPartner = false,
  basePrice,
  bundle,
  concernQuestion = "어떤 고민이 있으세요?",
  concernPlaceholder = "지금 마음에 걸리는 고민을 자유롭게 작성해 주세요.",
}: {
  productId: string;
  onBack?: () => void;
  /** free: 무료 생성(/generating), paid: 주문 생성 후 결제 페이지로 이동 */
  mode?: "free" | "paid";
  /** false면 고민 입력 단계 없이 이메일 단계에서 바로 결제 (사주 풀이 등 일반 풀이 상품용) */
  askConcern?: boolean;
  /** true면 이름 뒤에 직업 선택 단계 추가 (인생 사주 — 직업운·재물운 맞춤용) */
  askJob?: boolean;
  /** true면 고민 입력 전에 상대방 생년월일·성별 단계 추가 (재회 사주용) */
  askPartner?: boolean;
  /** 단품 가격 (추가 상품 선택 UI 표시용) */
  basePrice?: number;
  /** 추가 상품(정통 사주) 번들 — 있으면 마지막 단계에 패키지 선택 노출 */
  bundle?: { productId: string; price: number } | null;
  /** 고민 입력 스텝 제목 (기본: "어떤 고민이 있으세요?") — 재회 사주 등 상품별 커스텀 */
  concernQuestion?: string;
  /** 고민 입력 스텝 placeholder */
  concernPlaceholder?: string;
}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  // 번들이 있으면 마지막에 상품 선택 스텝 추가
  const showAddon = mode === "paid" && !!bundle;
  const steps: readonly Step[] = STEPS.filter(
    (s) =>
      (askConcern || s !== "concern") &&
      (askJob || (s !== "job" && s !== "love")) &&
      (askPartner || s !== "partner") &&
      (showAddon || s !== "product"),
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
  // 상대방 정보 (재회 사주 — askPartner일 때만 사용)
  const [pCalendar, setPCalendar] = useState<"solar" | "lunar">("solar");
  const [pYear, setPYear] = useState("");
  const [pMonth, setPMonth] = useState("");
  const [pDay, setPDay] = useState("");
  const [pGender, setPGender] = useState<"male" | "female" | null>(null);
  // "생년월일을 잘 몰라요"로 건너뛴 경우 — 상대 정보 없이 진행
  const [partnerUnknown, setPartnerUnknown] = useState(false);
  // 추가 상품(정통 사주) 선택 — 번들이 있을 때만 사용
  const [withAddon, setWithAddon] = useState(false);

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
  const pMonthRef = useRef<HTMLInputElement>(null);
  const pDayRef = useRef<HTMLInputElement>(null);

  const birthDate = year.length === 4 && month && day
    ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    : "";

  const partnerBirthDate = pYear.length === 4 && pMonth && pDay
    ? `${pYear}-${pMonth.padStart(2, "0")}-${pDay.padStart(2, "0")}`
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
    if (step === "partner") {
      if (!partnerBirthDate || !isValidDate(partnerBirthDate)) { toast.error("상대방 생년월일을 다시 확인해 주세요."); return; }
      if (!pGender) { toast.error("상대방 성별을 선택해 주세요."); return; }
      setPartnerUnknown(false);
    }
    if (step === "concern" && !concern.trim()) { toast.error("고민을 입력해 주세요."); return; }
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
        // 상대방 정보 (재회 사주) — love-saju와 동일한 [상대방] 태그 포맷
        ...(askPartner && !partnerUnknown && partnerBirthDate && pGender
          ? [`[상대방] 이름:미입력 생년월일:${partnerBirthDate} 시간:시간모름 성별:${pGender === "male" ? "남성" : "여성"} 달력:${pCalendar === "lunar" ? "음력" : "양력"}`]
          : []),
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
  // 이전은 고스트 원형으로 낮추고, 다음을 크고 진하게 — 주 행동 강조
  const circleBtnCls = "w-[42px] h-[42px] shrink-0 rounded-full border border-[#E3D8F4] bg-transparent transition-colors hover:bg-[#F3EDFB] flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none";
  const nextBtnCls = "w-14 h-14 shrink-0 rounded-full bg-[#DCD2F5] shadow-[0_4px_14px_rgba(143,123,214,0.3)] flex items-center justify-center transition-colors hover:bg-[#CFC0EE] disabled:opacity-50 disabled:pointer-events-none";
  const nextWideCls = "h-12 w-[min(340px,62vw)] rounded-full bg-[#DCD2F5] text-[#4A3A72] text-[14px] font-medium transition-colors hover:bg-[#CFC0EE] disabled:opacity-50 disabled:pointer-events-none";
  const nextBtnStyle = {};
  const prevBtnCls = circleBtnCls;
  const prevIcon = (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 4 L6 10 L12 16" stroke="#B9A8DD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const nextIcon = (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 4 L14 10 L8 16" stroke="#C95FC0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  // 주문 생성 등 대기 중 표시 — 화살표 대신 도는 스피너
  const spinnerIcon = (
    <svg className="animate-spin" width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="#C9BDE6" strokeWidth="2.4" />
      <path d="M10 3 a7 7 0 0 1 7 7" stroke="#C95FC0" strokeWidth="2.4" strokeLinecap="round" />
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
        {/* 진행 표시 — 별똥별 바: 진행 끝에서 별이 앞장서 간다 (밤하늘 배경과 세트) */}
        <div className="flex justify-center pt-3">
          <div className="relative w-[200px] h-[5px] rounded-full bg-white/25">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((stepIdx + 1) / steps.length) * 100}%`,
                background: "linear-gradient(90deg, rgba(255,255,255,0.25), #fff)",
              }}
            />
            <svg
              width="18" height="18" viewBox="0 0 20 20"
              className="absolute -top-[7px] transition-all duration-300"
              style={{ left: `calc(${((stepIdx + 1) / steps.length) * 100}% - 9px)` }}
              aria-hidden
            >
              <path
                d="M10 2.4 L12.3 7.2 L17.6 7.9 L13.7 11.5 L14.7 16.8 L10 14.2 L5.3 16.8 L6.3 11.5 L2.4 7.9 L7.7 7.2 Z"
                fill="#FBE38E" stroke="#EFBE68" strokeWidth="1.2" strokeLinejoin="round"
              />
            </svg>
          </div>
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
              <div className="flex items-center gap-3 justify-center">
                {onBack && (
                  <button type="button" onClick={onBack} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                )}
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
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
              <div className="flex items-center gap-3 justify-center mt-8">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
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
              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
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
              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
              </div>
            </>
          )}

          {step === "job" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>어떤 일을 하고 있나요?</h1>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {JOB_OPTIONS.map((opt) => radioRow(job === opt, opt, () => setJob(opt), opt))}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
              </div>
            </>
          )}

          {step === "love" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>지금 연애하고 있나요?</h1>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {LOVE_OPTIONS.map((opt) => radioRow(love === opt, opt, () => setLove(opt), opt))}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
              </div>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>이메일을 알려주세요.</h1>
              <input type="email" value={email} placeholder="결과지를 보내드려요."
                onChange={(e) => setEmail(e.target.value)}
                className={`${textInputCls} mb-8`} />
              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} disabled={submitting} className={nextBtnCls} style={nextBtnStyle} aria-label={isLastStep ? "결제하기" : "다음"}>
                  {submitting ? spinnerIcon : nextIcon}
                </button>
              </div>
            </>
          )}

          {step === "partner" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>그 사람은 언제 태어났나요?</h1>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {radioRow(pCalendar === "solar", "양력", () => setPCalendar("solar"), "p-solar")}
                {radioRow(pCalendar === "lunar", "음력", () => setPCalendar("lunar"), "p-lunar")}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={4} value={pYear} placeholder="1990"
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPYear(v); if (v.length === 4) pMonthRef.current?.focus(); }} className={`${numInputCls} pr-8`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">년</span>
                </div>
                <div className="relative">
                  <input ref={pMonthRef} type="text" inputMode="numeric" maxLength={2} value={pMonth} placeholder="05"
                    onChange={(e) => { const v = clamp2(e.target.value, 12); setPMonth(v); if (v.length === 2) pDayRef.current?.focus(); }} className={`${numInputCls} pr-6`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">월</span>
                </div>
                <div className="relative">
                  <input ref={pDayRef} type="text" inputMode="numeric" maxLength={2} value={pDay} placeholder="15"
                    onChange={(e) => setPDay(clamp2(e.target.value, 31))} className={`${numInputCls} pr-6`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">일</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {radioRow(pGender === "female", "여자", () => setPGender("female"), "p-female")}
                {radioRow(pGender === "male", "남자", () => setPGender("male"), "p-male")}
              </div>
              {/* 상대 생일을 모르면 내 사주만으로 풀이 */}
              <button
                type="button"
                onClick={() => { setPartnerUnknown(true); setStepIdx((i) => Math.min(i + 1, steps.length - 1)); }}
                className="mb-8 block w-full text-center text-sm text-mute underline underline-offset-4 transition-colors hover:text-[#8F7BD6]"
              >
                생년월일을 잘 몰라요
              </button>
              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
              </div>
            </>
          )}

          {step === "concern" && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>{concernQuestion}</h1>
              <div className="relative mb-8">
                <textarea value={concern} rows={6}
                  onChange={(e) => setConcern(e.target.value.slice(0, MAX_CONCERN))}
                  placeholder={concernPlaceholder}
                  className="block w-full resize-none rounded-[28px] bg-white border border-[#E7DDF8] px-6 py-5 text-sm text-[#4A3A72] leading-relaxed placeholder:text-[#4A3A72]/35 focus:outline-none focus:border-[#8F7BD6] transition-colors" />
                <p className="absolute bottom-4 right-5 text-xs text-mute">{concern.length}/{MAX_CONCERN}자</p>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                {showAddon ? (
                  // 번들이 있으면 다음 스텝(상품 선택)으로
                  <button type="button" onClick={next} className={nextBtnCls} style={nextBtnStyle} aria-label="다음">{nextIcon}</button>
                ) : (
                  <div className="relative">
                    {mode === "paid" && !hasCredit && <RefundTag floating />}
                    <button
                      type="button"
                      onClick={() => { if (!concern.trim()) { toast.error("고민을 입력해 주세요."); return; } submit(); }}
                      disabled={submitting}
                      className={nextWideCls}
                      style={nextBtnStyle}
                    >
                      <PayLabel submitting={submitting} hasCredit={hasCredit} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 상품 선택 스텝 — 번들이 있을 때 마지막 페이지 */}
          {step === "product" && bundle && (
            <>
              <h1 className="text-2xl font-bold text-[#4A3A72] mb-6" style={{ textShadow: "0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.85)" }}>어디까지 봐드릴까요?</h1>
              {/* 뉴모피즘 소프트 — 선택 줄은 눌린(오목), 미선택 줄은 떠 있는(볼록) */}
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setWithAddon(false)}
                  className="relative block w-full rounded-[18px] text-left transition-all"
                  style={{
                    // 선택 시 핑크 글로우, 미선택은 뉴모피즘 볼록
                    boxShadow: !withAddon
                      ? "0 0 0 3px rgba(201,95,192,0.14), 0 4px 18px rgba(201,95,192,0.35)"
                      : "4px 4px 12px rgba(143,123,214,0.2), -3px -3px 10px rgba(255,255,255,0.9)",
                  }}
                >
                  {/* 배경·테두리 레이어 */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-[18px]"
                    style={{
                      background: "#FBF9FE",
                      border: !withAddon ? "1.5px solid #DDA3D2" : "1.5px solid transparent",
                    }}
                  />
                  {/* 번들 티켓과 동일 구조·크기 — 스트립 / 절취선 / 본문 */}
                  <span className="relative flex items-center gap-[6px] px-4 pb-[14px] pt-[14px]">
                    <span className="text-sm font-medium text-[#4A3A72]"><span className="inline-block align-middle text-sm font-medium leading-5">고민 사주</span><span aria-hidden className="inline-block w-0 align-middle text-[17px] leading-none">&#8203;</span></span>
                    {/* 냥이 코+수염 장식 */}
                    <svg width="30" height="14" viewBox="0 0 30 14" aria-hidden className="shrink-0">
                      <circle cx="15" cy="7" r="2" fill="#E88BC4" />
                      <path
                        d="M11 5 C7 3.5, 4 3.5, 1 4.5 M11 8 C7 8, 4 8.5, 1.5 10 M19 5 C23 3.5, 26 3.5, 29 4.5 M19 8 C23 8, 26 8.5, 28.5 10"
                        stroke="#C9BDE6"
                        strokeWidth="1.2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="relative mx-2 block border-t-[1.5px] border-dashed border-[#E3D8F4]" />
                  <span className="relative flex items-center gap-2 px-4 pb-[12px] pt-[12px]">
                    <span className="flex-1 whitespace-nowrap text-xs leading-relaxed text-body">
                      내 고민에 정조준한
                      <br />
                      맞춤 풀이
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[15px] font-medium text-[#4A3A72]">{(basePrice ?? 3900).toLocaleString()}원</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithAddon(true)}
                  className="relative block w-full rounded-[18px] text-left transition-all"
                  style={{
                    // 선택 시 핑크 글로우, 미선택은 뉴모피즘 볼록
                    boxShadow: withAddon
                      ? "0 0 0 3px rgba(201,95,192,0.14), 0 4px 18px rgba(201,95,192,0.35)"
                      : "4px 4px 12px rgba(143,123,214,0.2), -3px -3px 10px rgba(255,255,255,0.9)",
                  }}
                >
                  {/* 배경·테두리 레이어 */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-[18px]"
                    style={{
                      background: "#FBF9FE",
                      border: withAddon ? "1.5px solid #DDA3D2" : "1.5px solid transparent",
                    }}
                  />
                  {/* 절취선 티켓 — 상단 스트립(제목 + 할인) / 카드 끝까지 닿는 점선 + 양옆 펀칭 홈 / 본문 */}
                  <span className="relative flex items-center gap-[6px] px-4 pb-[14px] pt-[14px]">
                    <span className="text-sm font-medium text-[#4A3A72]">
                      고민 사주{" "}
                      <span
                        className="text-[17px] leading-none"
                        style={{ fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif" }}
                      >
                        +
                      </span>{" "}
                      인생 사주
                    </span>
                    {/* 냥점 로고와 같은 기랑해랑 폰트 */}
                    <span
                      className="text-[17px] leading-none text-[#C95FC0]"
                      style={{ fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif" }}
                    >
                      5,000원 할인
                    </span>
                  </span>
                  <span className="relative mx-2 block border-t-[1.5px] border-dashed border-[#E3D8F4]" />
                  <span className="relative flex items-center gap-2 px-4 pb-[12px] pt-[12px]">
                    <span className="flex-1 whitespace-nowrap text-xs leading-relaxed text-body">
                      내 고민에 정조준한 맞춤 풀이
                      <br />
                      <span
                        className="text-[14px] leading-none"
                        style={{ fontFamily: "'Kirang Haerang', 'Gowun Dodum', sans-serif" }}
                      >
                        +
                      </span>{" "}
                      인생 전체 8만 자 분량의 리포트
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[15px] font-medium text-[#4A3A72]">{bundle.price.toLocaleString()}원</span>
                  </span>
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

              <div className="mt-8 flex items-center gap-3 justify-center">
                <button type="button" onClick={prev} className={prevBtnCls} aria-label="이전">{prevIcon}</button>
                <button type="button" onClick={submit} disabled={submitting} className={nextBtnCls} style={nextBtnStyle} aria-label="결제하기">
                  {submitting ? spinnerIcon : nextIcon}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}


/** 결제 버튼 라벨 */
function PayLabel({ submitting, hasCredit }: { submitting: boolean; hasCredit: boolean }) {
  if (submitting)
    return (
      <span className="inline-flex items-center justify-center">
        <Spinner size={18} />
      </span>
    );
  if (hasCredit) return <>무료 이용권으로 결과보기</>;
  return <>결제하기</>;
}

/** 결제 버튼 위 왼쪽에 붙는 환불 보증 태그 (핑크 솔리드 미니 라벨).
 *  floating — 버튼을 감싼 relative 컨테이너 기준으로 버튼 왼쪽 위에 절대 배치 */
export function RefundTag({ floating = false }: { floating?: boolean }) {
  return (
    <div className={floating ? "absolute bottom-full left-3 mb-[6px] whitespace-nowrap" : "mb-[7px] pl-4"}>
      <span className="rounded-[99px] rounded-bl-[3px] bg-[#C95FC0] px-[9px] py-[2px] text-[10.5px] text-white">
        불만족 시 100% 환불
      </span>
    </div>
  );
}
