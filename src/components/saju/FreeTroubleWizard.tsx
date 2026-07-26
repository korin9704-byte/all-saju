"use client";

// 무료 고민 사주 전용 단계형 입력 위저드 (/free-trouble-mx7q92)
// 디자인: 사이트 공통 입력폼 스타일 (흰 배경 + #f5f5f5 라운드 입력칸)
import { useState } from "react";
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

export function FreeTroubleWizard({ productId }: { productId: string }) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const step: Step = STEPS[stepIdx];

  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (step === "time" && !timeUnknown) {
      if (hour === "" || minute === "") { toast.error("태어난 시간을 입력하거나 '시간을 몰라요'를 선택해 주세요."); return; }
    }
    if (step === "gender" && !gender) { toast.error("성별을 선택해 주세요."); return; }
    if (step === "name" && !name.trim()) { toast.error("이름 또는 닉네임을 입력해 주세요."); return; }
    if (step === "email") {
      if (!email.trim()) { toast.error("결과지를 받을 이메일을 입력해 주세요."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("이메일 형식을 다시 확인해 주세요."); return; }
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function prev() {
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  function submit() {
    if (!concern.trim()) { toast.error("고민을 입력해 주세요."); return; }
    const payload = {
      productId,
      name: name.trim(),
      birthDate,
      birthTime: timeUnknown ? null : `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
      timeUnknown,
      gender,
      calendar,
      concerns: [concern.trim()],
      guestEmail: email.trim(),
    };
    try {
      sessionStorage.setItem("saju_generate", JSON.stringify({ kind: "free-trouble", payload }));
    } catch { /* ignore */ }
    setSubmitting(true);
    router.push("/generating");
  }

  const numInputCls = "w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm text-ink text-center placeholder:text-ink/40 focus:outline-none focus:bg-[#ebebeb] transition-colors disabled:opacity-40";
  const textInputCls = "w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-[#ebebeb] transition-colors";
  const nextBtnCls = "flex-1 h-14 rounded-full bg-ink text-white text-sm font-medium transition-colors hover:bg-ink/80 disabled:opacity-50 disabled:pointer-events-none";
  const prevBtnCls = "w-24 h-14 rounded-full bg-[#f5f5f5] text-ink text-sm font-medium transition-colors hover:bg-[#ebebeb]";

  const radioRow = (selected: boolean, label: string, onClick: () => void, key?: string) => (
    <label key={key ?? label}
      className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${selected ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
      <input type="radio" checked={selected} onChange={onClick} className="w-4 h-4 accent-black" />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-lg px-4 py-10 flex flex-col" style={{ minHeight: "88vh" }}>
        {/* 진행 표시 */}
        <div className="flex justify-center gap-2 pt-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === stepIdx ? 34 : 18,
                backgroundColor: i === stepIdx ? "#111111" : "#e5e5e5",
              }}
            />
          ))}
        </div>

        {/* 본문 */}
        <div className="mt-16">
          {step === "birth" && (
            <>
              <h1 className="text-2xl font-bold text-ink mb-6">태어난 날이 언제인가요?</h1>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {radioRow(calendar === "solar", "양력", () => setCalendar("solar"), "solar")}
                {radioRow(calendar === "lunar", "음력", () => setCalendar("lunar"), "lunar")}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-8">
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={4} value={year} placeholder="1990"
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} className={`${numInputCls} pr-8`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">년</span>
                </div>
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={2} value={month} placeholder="05"
                    onChange={(e) => setMonth(clamp2(e.target.value, 12))} className={`${numInputCls} pr-6`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">월</span>
                </div>
                <div className="relative">
                  <input type="text" inputMode="numeric" maxLength={2} value={day} placeholder="15"
                    onChange={(e) => setDay(clamp2(e.target.value, 31))} className={`${numInputCls} pr-6`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">일</span>
                </div>
              </div>
              <button type="button" onClick={next} className={`${nextBtnCls} w-full`}>다음</button>
            </>
          )}

          {step === "time" && (
            <>
              <h1 className="text-2xl font-bold text-ink mb-6">태어난 시간을 알려주세요</h1>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold text-ink mb-2">시 (0~23)</p>
                  <input type="text" inputMode="numeric" maxLength={2} value={hour} placeholder="10" disabled={timeUnknown}
                    onChange={(e) => setHour(clamp2(e.target.value, 23))} className={numInputCls} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink mb-2">분 (0~59)</p>
                  <input type="text" inputMode="numeric" maxLength={2} value={minute} placeholder="30" disabled={timeUnknown}
                    onChange={(e) => setMinute(clamp2(e.target.value, 59))} className={numInputCls} />
                </div>
              </div>
              <label className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 mb-8 transition-colors ${timeUnknown ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
                <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} className="w-4 h-4 accent-black" />
                <span className="text-sm text-ink">시간을 몰라요 · 입력 없이 넘어가도 괜찮아요</span>
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls}>다음</button>
              </div>
            </>
          )}

          {step === "gender" && (
            <>
              <h1 className="text-2xl font-bold text-ink mb-6">성별을 선택해주세요</h1>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {radioRow(gender === "female", "여자", () => setGender("female"), "female")}
                {radioRow(gender === "male", "남자", () => setGender("male"), "male")}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls}>다음</button>
              </div>
            </>
          )}

          {step === "name" && (
            <>
              <h1 className="text-2xl font-bold text-ink mb-6">어떻게 불러드릴까요?</h1>
              <p className="text-sm font-bold text-ink mb-2">이름 / 닉네임</p>
              <input value={name} maxLength={10}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해 주세요."
                className={textInputCls} />
              <p className="mt-2 mb-8 text-sm text-body">풀이에서 이렇게 불러드릴게요.</p>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls}>다음</button>
              </div>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold text-ink">결과지를 어디로 보내드릴까요?</h1>
              <p className="mt-1.5 mb-6 text-sm text-body">입력하신 이메일로 결과지 링크를 보내드려요.</p>
              <p className="text-sm font-bold text-ink mb-2">이메일</p>
              <input type="email" value={email} placeholder="결과지를 받을 이메일을 입력해 주세요."
                onChange={(e) => setEmail(e.target.value)}
                className={`${textInputCls} mb-8`} />
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={nextBtnCls}>다음</button>
              </div>
            </>
          )}

          {step === "concern" && (
            <>
              <h1 className="text-2xl font-bold text-ink mb-6">어떤 고민이 있으세요?</h1>
              <div className="relative mb-2">
                <textarea value={concern} rows={6}
                  onChange={(e) => setConcern(e.target.value.slice(0, MAX_CONCERN))}
                  placeholder={"(예시) 남자친구랑 헤어지고 다음 인연은 언제 올지, 재회는 가능할지 궁금해요.\n직장은 마케팅 쪽으로 옮겨도 될까요?"}
                  className="block w-full resize-none rounded-2xl bg-[#f5f5f5] px-5 py-4 text-sm text-ink leading-relaxed placeholder:text-ink/30 focus:outline-none transition-colors" />
                <p className="absolute bottom-4 right-5 text-xs text-mute">{concern.length}/{MAX_CONCERN}자</p>
              </div>
              <p className="mt-3 mb-8 text-sm text-body">자세히 적을수록 고민에 더 정확히 맞춰 드려요.</p>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={submit} disabled={submitting} className={nextBtnCls}>
                  {submitting ? "잠시만요..." : "내 사주 풀어보기"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
