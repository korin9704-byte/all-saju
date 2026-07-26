"use client";

// 무료 고민 사주 전용 단계형 입력 위저드 (/free-trouble-mx7q92)
// 배경 이미지: public/images/free-trouble-bg.png (없으면 어두운 그라데이션)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const TAN = "#E0AC7E";
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

  const inputCls = "w-full h-14 rounded-xl bg-black/45 border border-white/15 text-white text-center text-base placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors";
  const tanBtnCls = "flex-1 h-14 rounded-xl text-base font-bold text-[#1a1a1a] transition-opacity hover:opacity-90 disabled:opacity-50";
  const prevBtnCls = "w-24 h-14 rounded-xl bg-[#2a2a2a] text-white text-base font-bold transition-colors hover:bg-[#3a3a3a]";

  return (
    <div className="min-h-screen bg-[#141414] py-6 px-3 flex justify-center">
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          minHeight: "88vh",
          backgroundImage: "linear-gradient(rgba(10,10,12,0.25), rgba(10,10,12,0.92) 78%), url('/images/free-trouble-bg.png')",
          backgroundColor: "#17181d",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* 진행 표시 */}
        <div className="flex justify-center gap-2 pt-5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === stepIdx ? 34 : 18,
                backgroundColor: i === stepIdx ? TAN : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>

        {/* 본문 (하단 정렬) */}
        <div className="mt-auto px-6 pb-8 pt-24">
          <p className="text-sm font-bold mb-2" style={{ color: TAN }}>사주 고민풀이</p>

          {step === "birth" && (
            <>
              <h1 className="text-2xl font-bold text-white">언제 태어나셨나요?</h1>
              <p className="mt-1.5 mb-6 text-sm text-white/60">정확히 입력할수록 더 깊이 봐드려요.</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(["solar", "lunar"] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setCalendar(c)}
                    className="h-14 rounded-xl text-base font-bold transition-colors"
                    style={calendar === c
                      ? { backgroundColor: TAN, color: "#1a1a1a" }
                      : { backgroundColor: "rgba(0,0,0,0.45)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                    {c === "solar" ? "양력" : "음력"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: TAN }}>년</p>
                  <input inputMode="numeric" value={year} placeholder="1990"
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} className={inputCls} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: TAN }}>월</p>
                  <input inputMode="numeric" value={month} placeholder="05"
                    onChange={(e) => setMonth(clamp2(e.target.value, 12))} className={inputCls} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: TAN }}>일</p>
                  <input inputMode="numeric" value={day} placeholder="15"
                    onChange={(e) => setDay(clamp2(e.target.value, 31))} className={inputCls} />
                </div>
              </div>
              <button type="button" onClick={next} className={`${tanBtnCls} w-full`} style={{ backgroundColor: TAN }}>다음</button>
            </>
          )}

          {step === "time" && (
            <>
              <h1 className="text-2xl font-bold text-white">태어난 시간을 알려주세요</h1>
              <p className="mt-1.5 mb-6 text-sm text-white/60">정확히 입력할수록 더 깊이 봐드려요.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: TAN }}>시 (0~23)</p>
                  <input inputMode="numeric" value={hour} placeholder="10" disabled={timeUnknown}
                    onChange={(e) => setHour(clamp2(e.target.value, 23))} className={`${inputCls} disabled:opacity-40`} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: TAN }}>분 (0~59)</p>
                  <input inputMode="numeric" value={minute} placeholder="30" disabled={timeUnknown}
                    onChange={(e) => setMinute(clamp2(e.target.value, 59))} className={`${inputCls} disabled:opacity-40`} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 mb-6 cursor-pointer select-none">
                <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} className="sr-only" />
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                  style={timeUnknown ? { backgroundColor: TAN, color: "#1a1a1a" } : { border: "1.5px solid rgba(255,255,255,0.35)" }}>
                  {timeUnknown ? "✓" : ""}
                </span>
                <span className="text-sm text-white/75">시간을 몰라요 · 입력 없이 넘어가도 괜찮아요</span>
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={tanBtnCls} style={{ backgroundColor: TAN }}>다음</button>
              </div>
            </>
          )}

          {step === "gender" && (
            <>
              <h1 className="text-2xl font-bold text-white">성별을 선택해주세요</h1>
              <p className="mt-1.5 mb-6 text-sm text-white/60">정확히 입력할수록 더 깊이 봐드려요.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(["male", "female"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className="h-14 rounded-xl text-base font-bold transition-colors"
                    style={gender === g
                      ? { backgroundColor: TAN, color: "#1a1a1a" }
                      : { backgroundColor: "rgba(0,0,0,0.45)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                    {g === "male" ? "남성" : "여성"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={tanBtnCls} style={{ backgroundColor: TAN }}>다음</button>
              </div>
            </>
          )}

          {step === "name" && (
            <>
              <h1 className="text-2xl font-bold text-white">어떻게 불러드릴까요?</h1>
              <p className="mt-1.5 mb-6 text-sm text-white/60">정확히 입력할수록 더 깊이 봐드려요.</p>
              <p className="text-sm font-bold mb-2" style={{ color: TAN }}>이름 / 닉네임</p>
              <input value={name} maxLength={10}
                onChange={(e) => setName(e.target.value)}
                className={`${inputCls} !text-left px-5`} />
              <p className="mt-2 mb-6 text-sm text-white/50">풀이에서 이렇게 불러드릴게요.</p>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={tanBtnCls} style={{ backgroundColor: TAN }}>다음</button>
              </div>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="text-2xl font-bold text-white">결과지를 어디로 보내드릴까요?</h1>
              <p className="mt-1.5 mb-6 text-sm text-white/60">입력하신 이메일로 결과지 링크를 보내드려요.</p>
              <p className="text-sm font-bold mb-2" style={{ color: TAN }}>이메일</p>
              <input type="email" value={email} placeholder="nyang@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} !text-left px-5 mb-6`} />
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={next} className={tanBtnCls} style={{ backgroundColor: TAN }}>다음</button>
              </div>
            </>
          )}

          {step === "concern" && (
            <>
              <h1 className="text-2xl font-bold text-white">어떤 고민이 있으세요?</h1>
              <p className="mt-1.5 mb-6 text-sm text-white/60">정확히 입력할수록 더 깊이 봐드려요.</p>
              <div className="relative mb-2">
                <textarea value={concern} rows={6}
                  onChange={(e) => setConcern(e.target.value.slice(0, MAX_CONCERN))}
                  placeholder={"(예시) 남자친구랑 헤어지고 다음 인연은 언제 올지, 재회는 가능할지 궁금해요.\n직장은 마케팅 쪽으로 옮겨도 될까요?"}
                  className="block w-full rounded-xl bg-black/45 border border-white/15 text-white text-base leading-relaxed px-5 py-4 placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none transition-colors" />
                <p className="absolute -bottom-6 right-1 text-sm text-white/40">{concern.length}/{MAX_CONCERN}</p>
              </div>
              <p className="mt-8 mb-6 text-sm text-white/60">자세히 적을수록 고민에 더 정확히 맞춰 드려요.</p>
              <div className="flex gap-3">
                <button type="button" onClick={prev} className={prevBtnCls}>이전</button>
                <button type="button" onClick={submit} disabled={submitting} className={tanBtnCls} style={{ backgroundColor: TAN }}>
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
