"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Props = {
  productId: string;
  productSlug: string;
  isLoggedIn: boolean;
  /** MINI 모드: 결제 대신 /api/free-mini 로 무료 잠금 결과 생성 (공유받은 친구용) */
  miniMode?: boolean;
};

const DAEWUN_TILE_COLORS = ["#A8C8F0","#A5D6B8","#C5DE9E","#FFC4AE","#F8B4CC","#D9B8E8","#FFD9A8","#C1CDD6","#A8DBD4","#B9C2E8"];

const EXAMPLE_SAJU_QUESTIONS = [
  "올해 직장운과 재물운이 어떤지 궁금해요.",
  "연애운이 언제 풀릴지 알고 싶어요.",
  "제 성격과 타고난 재능이 궁금해요.",
];

const EXAMPLE_LOVE_QUESTIONS = [
  "결혼해도 괜찮은 관계인지 알고 싶어요.",
  "자꾸 싸우는데 우리가 잘 맞는 건지 모르겠어요.",
  "오래 함께할 수 있는 관계인지 궁금해요.",
];

const EXAMPLE_FREE_QUESTIONS = [
  "이직을 고민 중인데, 이 대운에 직장을 바꿔도 괜찮을까요?",
  "이 대운 동안 사업을 시작해도 좋은 흐름인가요?",
  "이 대운에 결혼 타이밍이 맞는지 알고 싶어요.",
];

const EXAMPLE_CONCERNS = [
  "좋아하는 사람이 있는데 고백해도 될지 모르겠어요. 2026년에 용기 내면 잘 될까요?",
  "작년 투자 실패로 빚이 생겨 마음이 무거워요. 2026년에 경제적으로 나아질 수 있을까요?",
  "회사 다니면서 창업 준비 중인데 불안해요. 제게 사업운이 있을까요?",
];

const MAX_CONCERN = 350;
const MAX_FREE_Q = 100;

const RELATIONSHIP_OPTIONS = ["솔로", "연애중", "결혼했어요", "새로운 출발 (돌싱/기타)", "직접 입력할게요"];
const LIFESTYLE_OPTIONS    = ["학생", "취업 준비중", "주부", "직장인", "자영업/프리랜서", "은퇴함", "직접 입력할게요"];

// love-saju 관계 옵션 (2열 그리드용 — 마지막 "직접 입력"은 전체 너비)
const LOVE_RELATION_OPTIONS = [
  ["친구", "썸남 썸녀"],
  ["연인", "배우자"],
  ["전여친 전남친", "전아내 전남편"],
  ["부모와 자녀", "형제/자매"],
  ["직장 동료", "사업 파트너"],
  ["아이돌과 팬", "아이돌과 아이돌"],
  ["나와 반려묘", "주인과 강아지"],
] as const;

/* ── 공통 칩 버튼 ── */
function ChipBtn({
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
      <input
        type="radio"
        className="sr-only"
        checked={selected}
        onChange={onClick}
      />
      {label}
    </label>
  );
}

export function SajuForm(props: Props) {
  return (
    <Suspense>
      <SajuFormInner {...props} />
    </Suspense>
  );
}

/** 결제 페이로드 (orders/create · orders/redeem 공용) */
type OrderPayload = {
  productId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  timeUnknown: boolean;
  gender: "male" | "female";
  calendar: "solar" | "lunar";
  concerns: string[];
};

function SajuFormInner({ productId, productSlug, isLoggedIn, miniMode = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const [name, setName]               = useState("");
  const [birthYear, setBirthYear]     = useState("");
  const [birthMonth, setBirthMonth]   = useState("");
  const [birthDay, setBirthDay]       = useState("");
  const birthDate = birthYear.length === 4 && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
    : "";
  const [birthTime, setBirthTime]     = useState("");
  const [timeUnknown, setTimeUnknown] = useState<boolean | null>(null);
  const [gender, setGender]           = useState<"male" | "female" | null>(null);
  const [calendar, setCalendar]       = useState<"solar" | "lunar" | null>(null);
  const [concernText, setConcernText] = useState("");

  // love-saju 전용 (상대방 정보)
  const [partnerName, setPartnerName]                 = useState("");
  const [partnerBirthYear, setPartnerBirthYear]       = useState("");
  const [partnerBirthMonth, setPartnerBirthMonth]     = useState("");
  const [partnerBirthDay, setPartnerBirthDay]         = useState("");
  const partnerBirthDate = partnerBirthYear.length === 4 && partnerBirthMonth && partnerBirthDay
    ? `${partnerBirthYear}-${partnerBirthMonth.padStart(2, "0")}-${partnerBirthDay.padStart(2, "0")}`
    : "";
  const [partnerBirthTime, setPartnerBirthTime] = useState("");
  const [partnerTimeUnknown, setPartnerTimeUnknown] = useState<boolean | null>(null);
  const [partnerGender, setPartnerGender]       = useState<"male" | "female" | null>(null);
  const [partnerCalendar, setPartnerCalendar]   = useState<"solar" | "lunar" | null>(null);
  const [relationship2, setRelationship2]       = useState<string | null>(null);
  const [relationship2Custom, setRelationship2Custom] = useState("");
  const [roleA, setRoleA]                       = useState("");
  const [roleB, setRoleB]                       = useState("");

  // premium-saju 전용
  const [daewunStartAge, setDaewunStartAge]       = useState<number | null>(null);
  const [relationship, setRelationship]           = useState<string | null>(null);
  const [relationshipCustom, setRelationshipCustom] = useState("");
  const [lifestyle, setLifestyle]                 = useState<string | null>(null);
  const [lifestyleCustom, setLifestyleCustom]     = useState("");
  const [freeQuestion, setFreeQuestion]           = useState("");

  const [submitting, setSubmitting] = useState(false);

  // 무료권 (리퍼럴 보상)
  const [credit, setCredit] = useState<{ available: number; earned: number } | null>(null);
  const [useFreeCredit, setUseFreeCredit] = useState(false);


  useEffect(() => {
    if (!isLoggedIn || miniMode) return;
    fetch("/api/referral/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.code) {
          setCredit(json);
          // 이용권이 있으면 기본으로 사용하도록 체크 (결제 대신 무료 열람)
          if ((json.available ?? 0) > 0) setUseFreeCredit(true);
        }
      })
      .catch(() => { /* 무료권 조회 실패는 무시 */ });
  }, [isLoggedIn, miniMode]);

  // 공유 링크의 추천 코드 저장 (로그인 왕복에도 유지되도록 localStorage)
  useEffect(() => {
    if (miniMode && refParam) {
      try { localStorage.setItem("saju_ref", refParam); } catch { /* ignore */ }
    }
  }, [miniMode, refParam]);

  // 생년월일 자동 포커스 이동
  const birthMonthRef    = useRef<HTMLInputElement>(null);
  const birthDayRef      = useRef<HTMLInputElement>(null);
  const birthMinuteRef   = useRef<HTMLInputElement>(null);
  const partnerBirthMonthRef = useRef<HTMLInputElement>(null);
  const partnerBirthDayRef   = useRef<HTMLInputElement>(null);
  const partnerBirthMinuteRef = useRef<HTMLInputElement>(null);

  const displayName = name.trim() ? `${name.trim()}님의` : "나의";

  // 대운 시기 목록 (1~100세, 10년 단위)
  const daewunPeriods = Array.from({ length: 10 }, (_, i) => {
    const startAge  = i * 10 + 1;
    const endAge    = startAge + 9;
    const byear     = birthDate ? parseInt(birthDate.split("-")[0]) : null;
    const startYear = byear ? byear + startAge - 1 : null;
    const endYear   = byear ? byear + endAge - 1 : null;
    const currentYear = new Date().getFullYear();
    const currentAge  = byear ? currentYear - byear + 1 : null;
    const isCurrent   = currentAge !== null && currentAge >= startAge && currentAge <= endAge;
    return { startAge, endAge, startYear, endYear, isCurrent };
  });

  // 주문 생성 → 결제 / 무료권 즉시 결과 / MINI 무료 잠금 결과
  const submitOrder = useCallback(async (payload: OrderPayload, mode: "pay" | "redeem" | "mini") => {
    setSubmitting(true);
    try {
      if (mode === "mini" || mode === "redeem") {
        // 진행률 화면(/generating)에서 생성 요청을 수행한다 (결제 플로우와 동일한 로딩 UX)
        let ref: string | undefined;
        if (mode === "mini") {
          try { ref = localStorage.getItem("saju_ref") ?? undefined; } catch { /* ignore */ }
        }
        const envelope = {
          kind: mode,
          payload: mode === "mini" ? { ...payload, ref } : payload,
        };
        try { sessionStorage.setItem("saju_generate", JSON.stringify(envelope)); } catch { /* ignore */ }
        router.push("/generating");
      } else {
        const res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "주문 생성 실패");
        router.push(`/checkout/${json.orderId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
      setSubmitting(false);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!birthDate) { toast.error("생년월일을 입력해 주세요"); return; }
    if (!calendar) { toast.error("달력 종류를 선택해 주세요"); return; }
    if (!gender) { toast.error("성별을 선택해 주세요"); return; }
    if (timeUnknown === null) { toast.error("태어난 시간 여부를 선택해 주세요"); return; }
    if (productSlug === "worry-saju" && !concernText.trim()) { toast.error("궁금한 점을 입력해 주세요"); return; }
    if (productSlug === "premium-saju" && !daewunStartAge) {
      toast.error("분석할 대운 시기를 선택해 주세요"); return;
    }
    if (productSlug === "love-saju" && !partnerName.trim()) {
      toast.error("두 번째 사람의 이름을 입력해 주세요"); return;
    }
    if (productSlug === "love-saju" && !partnerBirthDate) {
      toast.error("상대방 생년월일을 입력해 주세요"); return;
    }
    if (productSlug === "love-saju" && !relationship2) {
      toast.error("두 사람의 관계를 선택해 주세요"); return;
    }
    {
      const concerns: string[] = [];

      // worry-saju 고민
      if (concernText.trim()) concerns.push(concernText.trim());

      // premium-saju 추가 정보
      if (daewunStartAge) {
        const endAge = daewunStartAge + 9;
        const byear  = birthDate ? parseInt(birthDate.split("-")[0]) : null;
        const yearRange = byear
          ? ` (${byear + daewunStartAge - 1}년~${byear + endAge - 1}년)` : "";
        concerns.push(`[대운] ${daewunStartAge}세~${endAge}세${yearRange}`);
      }
      if (relationship) {
        const val = relationship === "직접 입력할게요" ? relationshipCustom.trim() : relationship;
        if (val) concerns.push(`[연애상황] ${val}`);
      }
      if (lifestyle) {
        const val = lifestyle === "직접 입력할게요" ? lifestyleCustom.trim() : lifestyle;
        if (val) concerns.push(`[일상] ${val}`);
      }
      if (freeQuestion.trim()) concerns.push(`[질문] ${freeQuestion.trim()}`);

      // love-saju 상대방 정보
      if (productSlug === "love-saju") {
        const partnerTime = partnerTimeUnknown ? "시간모름" : (partnerBirthTime || "시간모름");
        concerns.push(`[상대방] 이름:${partnerName || "미입력"} 생년월일:${partnerBirthDate} 시간:${partnerTime} 성별:${partnerGender === "male" ? "남성" : partnerGender === "female" ? "여성" : "미입력"} 달력:${(partnerCalendar ?? "solar") === "solar" ? "양력" : "음력"}`);
        const rel2Val = relationship2 === "직접 입력" ? relationship2Custom.trim() : relationship2;
        if (rel2Val) concerns.push(`[관계] ${rel2Val}`);
        if (roleA.trim()) concerns.push(`[역할A] ${roleA.trim()}`);
        if (roleB.trim()) concerns.push(`[역할B] ${roleB.trim()}`);
      }

      const payload: OrderPayload = {
        productId, name, birthDate,
        birthTime: timeUnknown ? null : birthTime
          ? birthTime.split(":").map((v) => v.padStart(2, "0")).join(":")
          : null,
        timeUnknown, gender, calendar, concerns,
      };

      // 미로그인 → 입력 저장 후 카카오 1초 로그인, /resume 전환 페이지에서 자동 이어서 진행
      if (!isLoggedIn) {
        try {
          sessionStorage.setItem(
            "saju_resume",
            JSON.stringify({ mode: miniMode ? "mini" : "pay", productSlug, payload }),
          );
        } catch { /* ignore */ }
        setSubmitting(true);
        const supabase = createClient();
        const next = "/resume";
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

      await submitOrder(
        payload,
        miniMode ? "mini" : useFreeCredit && (credit?.available ?? 0) > 0 ? "redeem" : "pay",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* love-saju: 섹션 1 헤더 */}
      {productSlug === "love-saju" && (
        <p className="text-base font-bold text-ink">첫 번째 사람</p>
      )}

      {/* 이름 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="name" className="text-base font-bold text-ink">이름</Label>

        </div>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요. (최대 4글자)"
          className="w-full rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none transition-colors"
          style={{ backgroundColor: name.trim() ? "#ebebeb" : "#f5f5f5" }} />
      </div>

      {/* 달력 종류 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-bold text-ink">달력 종류</Label>

        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["solar", "lunar"] as const).map((c) => (
            <label key={c} className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${calendar === c ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
              <input type="radio" name="calendar" checked={calendar === c} onChange={() => setCalendar(c)} className="w-4 h-4 accent-black" />
              <span className="text-sm text-ink">{c === "solar" ? "양력" : "음력"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-bold text-ink">생년월일</Label>

        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <input
              type="text" inputMode="numeric" maxLength={4} placeholder="1990"
              value={birthYear}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                setBirthYear(v);
                if (v.length === 4) birthMonthRef.current?.focus();
              }}
              className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-8 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
              style={{ backgroundColor: birthYear.length === 4 ? "#ebebeb" : "#f5f5f5" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">년</span>
          </div>
          <div className="relative">
            <input
              ref={birthMonthRef}
              type="text" inputMode="numeric" maxLength={2} placeholder="05"
              value={birthMonth}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                setBirthMonth(v);
                if (v.length === 2) birthDayRef.current?.focus();
              }}
              className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-6 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
              style={{ backgroundColor: birthMonth.length >= 1 ? "#ebebeb" : "#f5f5f5" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">월</span>
          </div>
          <div className="relative">
            <input
              ref={birthDayRef}
              type="text" inputMode="numeric" maxLength={2} placeholder="15"
              value={birthDay}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                setBirthDay(v);
              }}
              className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-5 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
              style={{ backgroundColor: birthDay.length >= 1 ? "#ebebeb" : "#f5f5f5" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">일</span>
          </div>
        </div>
      </div>

      {/* 성별 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-bold text-ink">성별</Label>

        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["female", "male"] as const).map((g) => (
            <label key={g} className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${gender === g ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
              <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} className="w-4 h-4 accent-black" />
              <span className="text-sm text-ink">{g === "female" ? "여자" : "남자"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 태어난 시간 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-bold text-ink">태어난 시간을 아시나요?</Label>

        </div>
        <div className="grid grid-cols-2 gap-3">
          {([false, true] as const).map((unknown) => (
            <label key={String(unknown)} className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${timeUnknown === unknown ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
              <input type="radio" name="timeKnown" checked={timeUnknown === unknown} onChange={() => setTimeUnknown(unknown)} className="w-4 h-4 accent-black" />
              <span className="text-sm text-ink">{unknown ? "아니오" : "예"}</span>
            </label>
          ))}
        </div>
        {timeUnknown === false && (
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text" inputMode="numeric" maxLength={2} placeholder="14"
                value={birthTime.split(":")[0] ?? ""}
                onChange={(e) => {
                  const h = e.target.value.replace(/\D/g, "").slice(0, 2);
                  const m = birthTime.split(":")[1] ?? "";
                  setBirthTime(`${h}:${m}`);
                  if (h.length === 2) birthMinuteRef.current?.focus();
                }}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-8 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">시</span>
            </div>
            <div className="relative">
              <input
                ref={birthMinuteRef}
                type="text" inputMode="numeric" maxLength={2} placeholder="30"
                value={birthTime.split(":")[1] ?? ""}
                onChange={(e) => {
                  const h = birthTime.split(":")[0] ?? "00";
                  const m = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setBirthTime(`${h}:${m}`);
                }}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-8 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">분</span>
            </div>
          </div>
        )}
      </div>

      {/* ── love-saju 전용 섹션: 상대방 정보 ── */}
      {productSlug === "love-saju" && (
        <>
          {/* 섹션 2 헤더 */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-base font-bold text-ink">두 번째 사람</p>
          </div>

          {/* 상대방 이름 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">이름</Label>

            </div>
            <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="이름을 입력해 주세요. (최대 4글자)"
              className="w-full rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none transition-colors"
              style={{ backgroundColor: partnerName.trim() ? "#ebebeb" : "#f5f5f5" }} />
          </div>

          {/* 상대방 달력 종류 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">달력 종류</Label>

            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["solar", "lunar"] as const).map((c) => (
                <label key={c} className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${partnerCalendar === c ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
                  <input type="radio" name="partnerCalendar" checked={partnerCalendar === c} onChange={() => setPartnerCalendar(c)} className="w-4 h-4 accent-black" />
                  <span className="text-sm text-ink">{c === "solar" ? "양력" : "음력"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 상대방 생년월일 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">생년월일</Label>

            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input
                  type="text" inputMode="numeric" maxLength={4} placeholder="1990"
                  value={partnerBirthYear}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPartnerBirthYear(v);
                    if (v.length === 4) partnerBirthMonthRef.current?.focus();
                  }}
                  className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-8 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
                  style={{ backgroundColor: partnerBirthYear.length === 4 ? "#ebebeb" : "#f5f5f5" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">년</span>
              </div>
              <div className="relative">
                <input
                  ref={partnerBirthMonthRef}
                  type="text" inputMode="numeric" maxLength={2} placeholder="05"
                  value={partnerBirthMonth}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setPartnerBirthMonth(v);
                    if (v.length === 2) partnerBirthDayRef.current?.focus();
                  }}
                  className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-6 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
                  style={{ backgroundColor: partnerBirthMonth.length >= 1 ? "#ebebeb" : "#f5f5f5" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">월</span>
              </div>
              <div className="relative">
                <input
                  ref={partnerBirthDayRef}
                  type="text" inputMode="numeric" maxLength={2} placeholder="15"
                  value={partnerBirthDay}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setPartnerBirthDay(v);
                  }}
                  className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-5 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
                  style={{ backgroundColor: partnerBirthDay.length >= 1 ? "#ebebeb" : "#f5f5f5" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">일</span>
              </div>
            </div>
          </div>

          {/* 상대방 성별 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">성별</Label>

            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["female", "male"] as const).map((g) => (
                <label key={g} className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${partnerGender === g ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
                  <input type="radio" name="partnerGender" checked={partnerGender === g} onChange={() => setPartnerGender(g)} className="w-4 h-4 accent-black" />
                  <span className="text-sm text-ink">{g === "female" ? "여자" : "남자"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 상대방 태어난 시간 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">태어난 시간을 아시나요?</Label>

            </div>
            <div className="grid grid-cols-2 gap-3">
              {([false, true] as const).map((unknown) => (
                <label key={String(unknown)} className={`flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-colors ${partnerTimeUnknown === unknown ? "bg-[#ebebeb]" : "bg-[#f5f5f5]"}`}>
                  <input type="radio" name="partnerTimeKnown" checked={partnerTimeUnknown === unknown} onChange={() => setPartnerTimeUnknown(unknown)} className="w-4 h-4 accent-black" />
                  <span className="text-sm text-ink">{unknown ? "아니오" : "예"}</span>
                </label>
              ))}
            </div>
            {partnerTimeUnknown === false && (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="text" inputMode="numeric" maxLength={2} placeholder="14"
                    value={partnerBirthTime.split(":")[0] ?? ""}
                    onChange={(e) => {
                      const h = e.target.value.replace(/\D/g, "").slice(0, 2);
                      const m = partnerBirthTime.split(":")[1] ?? "";
                      setPartnerBirthTime(`${h}:${m}`);
                      if (h.length === 2) partnerBirthMinuteRef.current?.focus();
                    }}
                    className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-8 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">시</span>
                </div>
                <div className="relative">
                  <input
                    ref={partnerBirthMinuteRef}
                    type="text" inputMode="numeric" maxLength={2} placeholder="30"
                    value={partnerBirthTime.split(":")[1] ?? ""}
                    onChange={(e) => {
                      const h = partnerBirthTime.split(":")[0] ?? "00";
                      const m = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setPartnerBirthTime(`${h}:${m}`);
                    }}
                    className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 pr-8 text-sm text-ink text-center focus:outline-none focus:bg-[#ebebeb] transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-body pointer-events-none">분</span>
                </div>
              </div>
            )}
          </div>

          {/* 섹션 3 헤더 */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-base font-bold text-ink">두 사람은 어떤 관계인가요?</p>
          </div>

          {/* 관계 선택 그리드 */}
          <div className="space-y-2">
            {LOVE_RELATION_OPTIONS.map(([a, b]) => (
              <div key={a} className="grid grid-cols-2 gap-2">
                {[a, b].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => { setRelationship2(opt); setRelationship2Custom(""); }}
                    className="h-11 rounded-xl text-sm font-medium transition-colors"
                    style={relationship2 === opt
                      ? { backgroundColor: "#000000", color: "#ffffff" }
                      : { backgroundColor: "#f5f5f5", color: "#000000" }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ))}
            {/* 직접 입력 — 전체 너비 */}
            <button
              type="button"
              onClick={() => setRelationship2("직접 입력")}
              className="w-full h-11 rounded-xl text-sm font-medium transition-colors"
              style={relationship2 === "직접 입력"
                ? { backgroundColor: "#000000", color: "#ffffff" }
                : { backgroundColor: "#f5f5f5", color: "#000000" }}
            >
              직접 입력
            </button>
            {relationship2 === "직접 입력" && (
              <input
                value={relationship2Custom}
                onChange={(e) => setRelationship2Custom(e.target.value)}
                placeholder="예: 소개팅에서 만난 지 3주 된 사이"
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-[#ebebeb] transition-colors"
              />
            )}
          </div>

          {/* 섹션 4 헤더 */}
          <div className="pt-2">
            <p className="text-base font-bold text-ink">각자의 역할을 입력해주세요 <span className="text-sm font-normal text-body">(선택)</span></p>
          </div>

          {/* 내 역할 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">{name.trim() ? `${name.trim()}의 역할` : "내 역할"}</Label>

            </div>
            <div className="relative">
              <input
                value={roleA}
                onChange={(e) => setRoleA(e.target.value.slice(0, 100))}
                placeholder="예: 엄마, 남자친구, 팬"
                className="w-full rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none transition-colors"
                style={{ backgroundColor: roleA.trim() ? "#ebebeb" : "#f5f5f5" }}
              />
              <p className="absolute bottom-3 right-4 text-xs text-mute pointer-events-none">{roleA.length}/100</p>
            </div>
          </div>

          {/* 상대방 역할 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">{partnerName.trim() ? `${partnerName.trim()}의 역할` : "상대방의 역할"}</Label>

            </div>
            <div className="relative">
              <input
                value={roleB}
                onChange={(e) => setRoleB(e.target.value.slice(0, 100))}
                placeholder="예: 딸, 여자친구, 아이돌"
                className="w-full rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none transition-colors"
                style={{ backgroundColor: roleB.trim() ? "#ebebeb" : "#f5f5f5" }}
              />
              <p className="absolute bottom-3 right-4 text-xs text-mute pointer-events-none">{roleB.length}/100</p>
            </div>
          </div>

          {/* 궁금한 점 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">궁금한 점 <span className="text-sm font-normal text-body">(선택)</span></Label>

            </div>
            <div className="relative">
              <textarea value={freeQuestion}
                onChange={(e) => setFreeQuestion(e.target.value.slice(0, MAX_FREE_Q))}
                placeholder="궁금한 점을 자유롭게 작성해주세요. 없다면 그냥 넘어가셔도 좋아요."
                rows={6}
                className="w-full resize-none rounded-2xl bg-[#f5f5f5] px-5 py-4 text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors"
              />
              <p className="absolute bottom-4 right-5 text-xs text-mute">{freeQuestion.length}/{MAX_FREE_Q}자</p>
            </div>
          </div>
        </>
      )}

      {/* ── premium-saju 전용 섹션 ── */}
      {productSlug === "premium-saju" && (
        <>
          {/* 대운 시기 */}
          <div className="space-y-1.5">
            <Label className="text-base font-bold text-ink">대운 시기</Label>
            <div className="flex items-center justify-between">
              <p className="text-sm text-body">어떤 시기의 대운을 볼까요?</p>

            </div>
            <div className="overflow-y-auto max-h-[420px] rounded-2xl border border-hairline">
              {daewunPeriods.map(({ startAge, endAge, startYear, endYear, isCurrent }, index) => (
                <button
                  type="button"
                  key={startAge}
                  onClick={() => setDaewunStartAge(startAge)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-hairline last:border-b-0 text-left transition-all hover:bg-[#f5f5f5]"
                  style={daewunStartAge === startAge ? { backgroundColor: "#000000" } : undefined}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white/90 text-sm font-bold"
                    style={{ backgroundColor: DAEWUN_TILE_COLORS[index % DAEWUN_TILE_COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-bold"
                      style={{ color: daewunStartAge === startAge ? "#ffffff" : "#000000" }}
                    >
                      {startAge}세 ~ {endAge}세
                    </p>
                    {startYear && (
                      <p
                        className="text-sm"
                        style={{ color: daewunStartAge === startAge ? "rgba(255,255,255,0.6)" : "#a3a3a3" }}
                      >
                        {startYear}년 ~ {endYear}년
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap"
                      style={daewunStartAge === startAge
                        ? { backgroundColor: "#ffffff", color: "#000000" }
                        : { backgroundColor: "#000000", color: "#ffffff" }}
                    >현재</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 추가 정보 인트로 */}
          <div className="pt-2 pb-1">
            <p className="text-base font-bold text-ink leading-snug">
              {name.trim() ? `${name.trim()}님의` : ""} 다가올 10년,<br />
              더 정확한 풀이를 위해<br />
              몇 가지 여쭤볼게요
            </p>
          </div>

          {/* 애정 상황 */}
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-base font-bold text-ink leading-relaxed">
                애정운 분석을 위해,<br />
                지금 {name.trim() ? `${name.trim()}님의` : "나의"} 상황을 알려주세요 <span className="text-sm font-normal text-body">(선택)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <ChipBtn key={opt} label={opt} selected={relationship === opt}
                  onClick={() => { setRelationship(opt); if (opt !== "직접 입력할게요") setRelationshipCustom(""); }} />
              ))}
            </div>
            {relationship === "직접 입력할게요" && (
              <input value={relationshipCustom}
                onChange={(e) => setRelationshipCustom(e.target.value)}
                placeholder="예: 장거리 연애 중이에요"
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-[#ebebeb] transition-colors" />
            )}
          </div>

          {/* 현재 생활 */}
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-base font-bold text-ink leading-relaxed">
                성공운과 재물운을 짚어보기 위해,<br />
                주로 어떤 일상을 보내고 계신가요? <span className="text-sm font-normal text-body">(선택)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE_OPTIONS.map((opt) => (
                <ChipBtn key={opt} label={opt} selected={lifestyle === opt}
                  onClick={() => { setLifestyle(opt); if (opt !== "직접 입력할게요") setLifestyleCustom(""); }} />
              ))}
            </div>
            {lifestyle === "직접 입력할게요" && (
              <input value={lifestyleCustom}
                onChange={(e) => setLifestyleCustom(e.target.value)}
                placeholder="예: 유튜버로 활동 중이에요"
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:bg-[#ebebeb] transition-colors" />
            )}
          </div>

          {/* 궁금한 점 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold text-ink">궁금한 점 <span className="text-sm font-normal text-body">(선택)</span></Label>

            </div>
            <div className="relative">
              <textarea value={freeQuestion}
                onChange={(e) => setFreeQuestion(e.target.value.slice(0, MAX_FREE_Q))}
                placeholder="궁금한 점을 자유롭게 작성해주세요. 없다면 그냥 넘어가셔도 좋아요."
                rows={6}
                className="w-full resize-none rounded-2xl bg-[#f5f5f5] px-5 py-4 text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors"
              />
              <p className="absolute bottom-4 right-5 text-xs text-mute">{freeQuestion.length}/{MAX_FREE_Q}자</p>
            </div>
          </div>
        </>
      )}

      {/* ── today-fortune / realestate-saju / romance-saju / job-saju / business-saju 궁금한 점 섹션 ── */}
      {(productSlug === "today-fortune" || productSlug === "realestate-saju" || productSlug === "romance-saju" || productSlug === "job-saju" || productSlug === "business-saju") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-bold text-ink">궁금한 점 <span className="text-sm font-normal text-body">(선택)</span></Label>
          </div>
          <div className="relative">
            <textarea value={freeQuestion}
              onChange={(e) => setFreeQuestion(e.target.value.slice(0, MAX_FREE_Q))}
              placeholder="궁금한 점을 자유롭게 작성해주세요. 없다면 그냥 넘어가셔도 좋아요."
              rows={6}
              className="w-full resize-none rounded-2xl bg-[#f5f5f5] px-5 py-4 text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors"
            />
            <p className="absolute bottom-4 right-5 text-xs text-mute">{freeQuestion.length}/{MAX_FREE_Q}자</p>
          </div>
        </div>
      )}

      {/* ── worry-saju 고민 섹션 ── */}
      {productSlug === "worry-saju" && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-bold text-ink">궁금한 점</Label>
          </div>
          <div className="relative">
            <textarea
              value={concernText}
              onChange={(e) => setConcernText(e.target.value.slice(0, MAX_CONCERN))}
              placeholder="궁금한 점을 자유롭게 작성해주세요."
              rows={6}
              className="w-full resize-none rounded-2xl bg-[#f5f5f5] px-5 py-4 text-sm text-ink placeholder:text-ink/30 focus:outline-none transition-colors"
            />
            <p className="absolute bottom-4 right-5 text-xs text-mute">{concernText.length}/{MAX_CONCERN}자</p>
          </div>
        </div>
      )}

      {/* 무료권 사용 (리퍼럴 보상 보유 시, MINI 모드 제외) */}
      {!miniMode && (credit?.available ?? 0) > 0 && (
        <label className="flex items-center justify-between rounded-2xl border-2 border-ink px-5 py-4 cursor-pointer">
          <div>
            <p className="text-sm font-bold text-ink">무료 이용권 1개 사용하기</p>
          </div>
          <input
            type="checkbox"
            checked={useFreeCredit}
            onChange={(e) => setUseFreeCredit(e.target.checked)}
            className="w-5 h-5 accent-black"
          />
        </label>
      )}

      {/* 제출 버튼 */}
      <button type="submit" disabled={submitting}
        className="w-full h-14 rounded-full bg-ink text-white text-sm font-medium transition-colors hover:bg-ink/80 disabled:opacity-50 disabled:pointer-events-none">
        {submitting
          ? "잠시만요..."
          : miniMode
            ? (isLoggedIn ? "결과보기" : "카카오 1초 로그인하고 결과보기")
            : useFreeCredit && (credit?.available ?? 0) > 0
              ? "무료 이용권으로 결과보기"
              : isLoggedIn
                ? "결제하기"
                : "카카오 1초 로그인하고 결제하기"}
      </button>
      {!isLoggedIn && (
        <p className="text-xs text-center text-mute">
          {miniMode
            ? "결과 저장을 위해 카카오 로그인이 필요해요 · 결제 없음"
            : "결과 저장을 위해 카카오 로그인이 필요해요 · 입력한 내용은 그대로 유지돼요"}
          <br />
          로그인 시 <a href="/legal/terms" className="underline" target="_blank">이용약관</a>과{" "}
          <a href="/legal/privacy" className="underline" target="_blank">개인정보처리방침</a>에 동의하게 됩니다
        </p>
      )}


    </form>
  );
}
