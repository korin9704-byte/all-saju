import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MyeongsikTable } from "@/components/saju/MyeongsikTable";
import { ResultBody } from "@/components/saju/ResultBody";
import { AccordionBody } from "@/components/saju/AccordionBody";
import { LockedAccordionBody } from "@/components/saju/LockedAccordionBody";
import { DaewunResultBody } from "@/components/saju/DaewunResultBody";
import { DaewunManseryeokToggle } from "@/components/saju/DaewunManseryeokToggle";
import { LoveSajuTable } from "@/components/saju/LoveSajuTable";
import { OtherProducts } from "@/components/saju/OtherProducts";
import { ShareRewardCard } from "@/components/saju/ShareRewardCard";
import { computeMyeongsik } from "@/lib/saju/manseryeok";
import { fetchSajuAnalysis, ganjiToMyeongsik, isSajuApiConfigured, type BirthInfo } from "@/lib/saju/saju-api";
import type { Myeongsik } from "@/lib/saju/manseryeok";
import { formatDate } from "@/lib/utils";

// 카톡 미리보기용 동적 메타 (제목·설명 + opengraph-image 파일 컨벤션으로 OG 카드 자동 연결)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  const service = createServiceClient();
  const { data: result } = await service
    .from("saju_results")
    .select("interpretation_md, order_id")
    .eq("id", resultId)
    .maybeSingle();
  if (!result) return { title: "결과지" };

  const { data: order } = await service
    .from("orders")
    .select("product_id")
    .eq("id", result.order_id)
    .maybeSingle();
  const { data: product } = order
    ? await service.from("products").select("name").eq("id", order.product_id).maybeSingle()
    : { data: null };
  const { data: input } = await service
    .from("saju_inputs")
    .select("name")
    .eq("order_id", result.order_id)
    .maybeSingle();

  const firstTitle = result.interpretation_md.match(/^## (.+)$/m)?.[1]?.trim();
  const who = input?.name ? `${input.name}님의` : "나의";
  const title = `${who} ${product?.name ?? "사주 결과지"}`;
  const description = firstTitle
    ? `“${firstTitle}” — 3분 만에 보는 내 사주, 지금 무료로 확인해 보세요`
    : "3분 만에 보는 내 사주, 지금 무료로 확인해 보세요";
  return { title, description, openGraph: { title, description } };
}

function formatBirthDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

function formatBirthDot(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function formatTime(time: string) {
  return time.slice(0, 5); // "HH:MM:SS" → "HH:MM"
}

/** LLM 출력에서 점수·제목을 파싱하고 본문 마크다운을 반환 */
function parseLoveResult(md: string): {
  score: number | null;
  title: string;
  bodyMd: string;
} {
  const scoreMatch = md.match(/## 궁합 점수\s*\n\s*(\d+)/);
  const titleMatch = md.match(/## 궁합 제목\s*\n([^\n]+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
  const title = titleMatch ? titleMatch[1].trim() : "";

  // 점수·제목 섹션 제거 후 나머지를 본문으로
  let bodyMd = md
    .replace(/## 궁합 점수[\s\S]*?(?=\n## |\n---\s*$|$)/, "")
    .replace(/## 궁합 제목[\s\S]*?(?=\n## |\n---\s*$|$)/, "")
    .trim();

  return { score, title, bodyMd };
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ resultId: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { resultId } = await params;
  const { ref: refParam } = await searchParams;
  const service = createServiceClient();

  const { data: result } = await service
    .from("saju_results")
    .select("id, myeongsik, interpretation_md, llm_provider, llm_model, created_at, order_id, locked")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) notFound();

  const { data: order } = await service
    .from("orders")
    .select("product_id, paid_at, user_id")
    .eq("id", result.order_id)
    .single();
  const { data: product } = order
    ? await service.from("products").select("name, slug").eq("id", order.product_id).single()
    : { data: null };

  const { data: sajuInput } = await service
    .from("saju_inputs")
    .select("name, birth_date, birth_time, time_unknown, calendar, gender, concerns")
    .eq("order_id", result.order_id)
    .maybeSingle();

  const myeongsik     = result.myeongsik as unknown as Myeongsik;
  const isMiniLayout   = product?.slug === "today-fortune-mini";
  const isTodayFortune = product?.slug === "today-fortune" || isMiniLayout;
  const isDaewun       = product?.slug === "premium-saju";
  const isLoveSaju     = product?.slug === "love-saju";
  const isLocked       = isMiniLayout && result.locked === true;

  // 공유로 유입된 방문자(비소유자)용 CTA — ref가 있으면 미니 랜딩에 어트리뷰션 연결
  const supabaseAuth = await createClient();
  const { data: { user: viewer } } = await supabaseAuth.auth.getUser();
  const isOwner = !!viewer && viewer.id === order?.user_id;
  const visitorCta = !isOwner ? (
    <a
      href={refParam ? `/free?ref=${encodeURIComponent(refParam)}` : "/free"}
      className="block mb-6 rounded-2xl px-5 py-4 text-center text-sm font-bold transition-opacity hover:opacity-90"
      style={{ background: "#FEE500", color: "#191919" }}
    >
      나도 내 사주 무료로 보기 🎁 — 생년월일만 넣으면 3분이면 끝
    </a>
  ) : null;

  /* ── today-fortune 전용 레이아웃 ── */
  if (isTodayFortune) {
    // MINI 잠금 결과: 언락 가격은 원본 상품 가격
    let unlockPrice = 990;
    if (isLocked) {
      const { data: fullProduct } = await service
        .from("products")
        .select("price")
        .eq("slug", "today-fortune")
        .maybeSingle();
      unlockPrice = fullProduct?.price ?? 990;
    }
    const displayName = sajuInput?.name ? `${sajuInput.name}님의` : "";
    const todayConcerns = (sajuInput?.concerns ?? []) as string[];
    const todayQuestionRaw = todayConcerns.find((c: string) => c.startsWith("[질문]")) ?? "";
    const todayQuestion = todayQuestionRaw.replace(/^\[질문\]\s*/, "").trim();
    const tags = [
      sajuInput?.birth_date ? formatBirthDate(sajuInput.birth_date) : null,
      sajuInput?.calendar === "lunar" ? "음력" : "양력",
      sajuInput?.time_unknown ? "시간 모름" : sajuInput?.birth_time ? formatTime(sajuInput.birth_time) : null,
      sajuInput?.gender === "male" ? "남성" : "여성",
    ].filter(Boolean) as string[];

    return (
      <div className="max-w-2xl mx-auto py-12">
        {visitorCta}
        <header className="mb-0 rounded-t-2xl overflow-hidden" style={{ background: "#000000" }}>
          <div className="px-6 pt-6 pb-5 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {displayName} {isLocked ? "‘사주 해설 MINI’" : "‘사주 해설’"}
            </h1>
          </div>
          <div className="px-5 pb-5 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
                {tag}
              </span>
            ))}
          </div>
          {todayQuestion && (
            <div className="px-5 pb-5 text-center">
              <p className="text-xs text-white leading-relaxed">Q. {todayQuestion}</p>
            </div>
          )}
        </header>

        <section>
          <MyeongsikTable myeongsik={myeongsik} />
        </section>

        <article className="rounded-b-2xl overflow-hidden">
          {isLocked ? (
            <LockedAccordionBody
              markdown={result.interpretation_md}
              resultId={result.id}
              unlockPrice={unlockPrice}
              visibleCount={6}
              headerTitle="사주 해설"
            />
          ) : (
            <AccordionBody markdown={result.interpretation_md} headerTitle="사주 해설" limit={13} />
          )}
        </article>

        {isOwner && !isLocked && <ShareRewardCard resultId={result.id} />}

        <OtherProducts currentSlug={product?.slug} />

        <footer className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">냥점 · 본 결과는 참고용이며 전문 상담을 대체하지 않습니다</p>
        </footer>
      </div>
    );
  }

  /* ── premium-saju (대운 해설) 레이아웃 ── */
  if (isDaewun) {
    const concerns       = (sajuInput?.concerns ?? []) as string[];
    const daewunConcern  = concerns.find((c: string) => c.startsWith("[대운]")) ?? "";
    const periodLabel    = daewunConcern.replace("[대운] ", "").trim();
    const questionConcern = concerns.find((c: string) => c.startsWith("[질문]")) ?? "";
    const questionText   = questionConcern.replace("[질문] ", "").trim();
    const displayName    = sajuInput?.name ? `${sajuInput.name}님의` : "";

    const birthYear = sajuInput?.birth_date ? parseInt(sajuInput.birth_date.split("-")[0]) : null;
    const currentYear = new Date().getFullYear();
    const koreanAge   = birthYear ? currentYear - birthYear + 1 : null;
    const ageMatch    = periodLabel.match(/(\d+)세~(\d+)세/);
    const selectedStartAge = ageMatch ? parseInt(ageMatch[1]) : null;

    const periods = Array.from({ length: 10 }, (_, i) => {
      const startAge  = i * 10 + 1;
      const endAge    = startAge + 9;
      const startYear = birthYear ? birthYear + startAge - 1 : null;
      const isCurrent = koreanAge !== null && koreanAge >= startAge && koreanAge <= endAge;
      return { startAge, endAge, startYear, isCurrent };
    });

    const tags = [
      sajuInput?.birth_date ? formatBirthDate(sajuInput.birth_date) : null,
      sajuInput?.calendar === "lunar" ? "음력" : "양력",
      sajuInput?.time_unknown ? "시간 모름" : sajuInput?.birth_time ? formatTime(sajuInput.birth_time) : null,
      sajuInput?.gender === "male" ? "남성" : "여성",
    ].filter(Boolean) as string[];

    return (
      <div className="max-w-2xl mx-auto py-12">
        {visitorCta}
        <div className="rounded-2xl overflow-hidden">
          <header className="mb-0" style={{ background: "#000000" }}>
            <div className="px-6 pt-6 pb-3 text-center">
              {periodLabel && (
                <span className="inline-block mb-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
                  {periodLabel}
                </span>
              )}
              <h1 className="text-xl font-bold text-white tracking-tight">
                {displayName} ‘대운 해설’
              </h1>
            </div>
            <div className="px-5 pb-5 flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
                  {tag}
                </span>
              ))}
            </div>
            {questionText && (
              <div className="px-5 pb-5 text-center">
                <p className="text-xs text-white leading-relaxed">
                  Q. {questionText}
                </p>
              </div>
            )}
          </header>

          <DaewunManseryeokToggle
            myeongsik={myeongsik}
            periods={periods}
            selectedStartAge={selectedStartAge}
          />

          <article>
            <div className="px-5 py-4 text-center" style={{ background: "#1a1a1a" }}>
              <p className="text-sm font-semibold tracking-widest text-white">대운 해설</p>
              <p className="text-xs mt-1" style={{ color: "#888" }}>각 제목을 클릭하면 해설이 펼쳐져요</p>
            </div>
            <DaewunResultBody markdown={result.interpretation_md} />
          </article>
        </div>

        {isOwner && <ShareRewardCard resultId={result.id} />}

        <OtherProducts currentSlug={product?.slug} />

        <footer className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">냥점 · 본 결과는 참고용이며 전문 상담을 대체하지 않습니다</p>
        </footer>
      </div>
    );
  }

  /* ── love-saju (궁합) 레이아웃 ── */
  if (isLoveSaju) {
    const concerns = (sajuInput?.concerns ?? []) as string[];

    // 상대방 정보 파싱
    const partnerConcern   = concerns.find((c: string) => c.startsWith("[상대방]")) ?? "";
    const pNameMatch       = partnerConcern.match(/이름:([^\s]+)/);
    const pBirthMatch      = partnerConcern.match(/생년월일:(\d{4}-\d{2}-\d{2})/);
    const pTimeMatch       = partnerConcern.match(/시간:([^\s]+)/);
    const pGenderMatch     = partnerConcern.match(/성별:(남성|여성)/);
    const pCalendarMatch   = partnerConcern.match(/달력:(양력|음력)/);

    const partnerRawName   = pNameMatch?.[1];
    const partnerName      = partnerRawName && partnerRawName !== "미입력" ? partnerRawName : null;
    const partnerBirthDate = pBirthMatch?.[1] ?? null;
    const partnerGender    = pGenderMatch?.[1] === "남성" ? "male" : "female";
    const partnerCalendar: "solar" | "lunar" = pCalendarMatch?.[1] === "음력" ? "lunar" : "solar";
    const partnerTimeRaw   = pTimeMatch?.[1] ?? "";
    const partnerTimeUnknown = !partnerTimeRaw || partnerTimeRaw === "시간모름" || partnerTimeRaw === "미입력";
    const partnerBirthTime: string | null = partnerTimeUnknown ? null : partnerTimeRaw;

    // 상대방 명식 계산
    let partnerMyeongsik: Myeongsik | null = null;
    if (partnerBirthDate) {
      try {
        if (isSajuApiConfigured()) {
          const [py, pm, pd] = partnerBirthDate.split("-");
          const hasT = !partnerTimeUnknown && !!partnerBirthTime;
          const [phh, pmm] = hasT ? partnerBirthTime!.split(":") : [undefined, undefined];
          const pBirthInfo: BirthInfo = {
            birthYear: py,
            birthMonth: String(parseInt(pm, 10)),
            birthDay: String(parseInt(pd, 10)),
            ...(hasT ? { birthHour: String(parseInt(phh!, 10)), birthMinute: String(parseInt(pmm!, 10)) } : {}),
            calendarType: partnerCalendar === "lunar" ? "음력" : "양력",
            gender: partnerGender,
          };
          const pAnalysis = await fetchSajuAnalysis(pBirthInfo, [], { source: "manual" });
          partnerMyeongsik = ganjiToMyeongsik(pAnalysis) ?? await computeMyeongsik({
            birthDate: partnerBirthDate, birthTime: partnerBirthTime,
            timeUnknown: partnerTimeUnknown, calendar: partnerCalendar, gender: partnerGender,
          });
        } else {
          partnerMyeongsik = await computeMyeongsik({
            birthDate: partnerBirthDate, birthTime: partnerBirthTime,
            timeUnknown: partnerTimeUnknown, calendar: partnerCalendar, gender: partnerGender,
          });
        }
      } catch {
        // 계산 실패 시 null 유지
      }
    }

    // 관계·역할 파싱
    const relationConcern = concerns.find((c: string) => c.startsWith("[관계]")) ?? "";
    const roleAConcern    = concerns.find((c: string) => c.startsWith("[역할A]")) ?? "";
    const roleBConcern    = concerns.find((c: string) => c.startsWith("[역할B]")) ?? "";
    const relationLabel   = relationConcern.replace("[관계] ", "").trim();
    const roleA           = roleAConcern.replace("[역할A] ", "").trim();
    const roleB           = roleBConcern.replace("[역할B] ", "").trim();

    // 기타 질문
    const loveQuestionRaw = concerns.find((c: string) => c.startsWith("[질문]")) ?? "";
    const loveQuestion = loveQuestionRaw.replace("[질문]", "").trim();

    // 이름 표시
    const nameA = sajuInput?.name ?? "";
    const nameB = partnerName ?? "";
    const displayA = nameA || "나";
    const displayB = nameB || "상대방";

    // LLM 출력 파싱
    const { score, title, bodyMd } = parseLoveResult(result.interpretation_md);

    return (
      <div className="max-w-2xl mx-auto">
        {visitorCta}
        {/* ── 헤더: 제목 + 점수 (핑크→오렌지) ── */}
        <div className="px-6 pt-10 pb-8 text-center rounded-t-2xl overflow-hidden" style={{ background: "#000000" }}>
          {title && (
            <h1 className="text-lg font-bold text-white leading-snug mb-6 whitespace-pre-wrap">
              {title}
            </h1>
          )}
          {score !== null && (
            <div className="text-[72px] font-extrabold text-white leading-none">
              {score}
            </div>
          )}
          {!title && !score && (
            <h1 className="text-xl font-bold text-white">{displayA} &amp; {displayB}</h1>
          )}
        </div>

        {/* ── 관계 바 ── */}
        {(relationLabel || loveQuestion) && (
          <div className="py-3 px-5 text-center bg-[#1a1a1a] text-white">
            {relationLabel && (
              <p className="text-sm font-bold tracking-widest">{relationLabel}</p>
            )}
            {loveQuestion && (
              <p className="text-xs mt-1 opacity-75">Q. {loveQuestion}</p>
            )}
          </div>
        )}

        {/* ── 두 사람 정보 카드 ── */}
        <div className="bg-white border-b border-border">
          <div className="grid grid-cols-[1fr_40px_1fr] items-center px-5 py-5">
            <div className="text-center">
              <p className="text-base font-bold text-ink mb-1">{displayA}</p>
              {sajuInput?.birth_date && (
                <p className="text-xs font-semibold" style={{ color: "#000000" }}>
                  {formatBirthDot(sajuInput.birth_date)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ({sajuInput?.calendar === "lunar" ? "음력" : "양력"})
              </p>
              <p className="text-xs text-muted-foreground">
                {sajuInput?.time_unknown ? "시간 모름" : sajuInput?.birth_time ? formatTime(sajuInput.birth_time) : "시간 모름"}
              </p>
              {roleA && (
                <p className="text-xs font-semibold mt-1" style={{ color: "#000000" }}>{roleA}</p>
              )}
            </div>

            <div className="flex items-center justify-center">
              <span className="text-3xl" style={{ color: "#000000" }}>↔</span>
            </div>

            <div className="text-center">
              <p className="text-base font-bold text-ink mb-1">{displayB}</p>
              {partnerBirthDate && (
                <p className="text-xs font-semibold" style={{ color: "#000000" }}>
                  {formatBirthDot(partnerBirthDate)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ({partnerCalendar === "lunar" ? "음력" : "양력"})
              </p>
              <p className="text-xs text-muted-foreground">
                {partnerTimeUnknown ? "시간 모름" : partnerBirthTime ? formatTime(partnerBirthTime) : "시간 모름"}
              </p>
              {roleB && (
                <p className="text-xs font-semibold mt-1" style={{ color: "#000000" }}>{roleB}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── 두 사주 테이블 나란히 ── */}
        <div className="grid grid-cols-2 gap-px bg-[#e5e5e5] border-b border-[#e5e5e5]">
          <div><LoveSajuTable myeongsik={myeongsik} /></div>
          <div>
            {partnerMyeongsik ? (
              <LoveSajuTable myeongsik={partnerMyeongsik} />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#fafafa] text-xs text-muted-foreground py-10">
                명식 없음
              </div>
            )}
          </div>
        </div>

        {/* ── 아코디언 본문 ── */}
        <article className="rounded-b-2xl overflow-hidden">
          <AccordionBody
            markdown={bodyMd || result.interpretation_md}
            headerTitle="궁합 해설"
            limit={13}
          />
        </article>

        {isOwner && <ShareRewardCard resultId={result.id} />}

        <OtherProducts currentSlug={product?.slug} />

        <footer className="mt-10 pb-10 text-center">
          <p className="text-xs text-muted-foreground">냥점 · 본 결과는 참고용이며 전문 상담을 대체하지 않습니다</p>
        </footer>
      </div>
    );
  }

  /* ── 일반 상품 레이아웃 (worry-saju 등) ── */
  const displayName = sajuInput?.name ? `${sajuInput.name}님의` : "";
  const generalConcerns = (sajuInput?.concerns ?? []) as string[];
  const generalQuestion =
    generalConcerns.find((c: string) => !c.startsWith("["))?.trim() ||
    (generalConcerns.find((c: string) => c.startsWith("[질문]")) ?? "").replace(/^\[질문\]\s*/, "").trim();
  const tags = [
    sajuInput?.birth_date ? formatBirthDate(sajuInput.birth_date) : null,
    sajuInput?.calendar === "lunar" ? "음력" : "양력",
    sajuInput?.time_unknown ? "시간 모름" : sajuInput?.birth_time ? formatTime(sajuInput.birth_time) : null,
    sajuInput?.gender === "male" ? "남성" : "여성",
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-2xl mx-auto py-12">
      {visitorCta}
      <header className="mb-0 rounded-t-2xl overflow-hidden" style={{ background: "#000000" }}>
        <div className="px-6 pt-6 pb-5 text-center">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {displayName} ‘{product?.name ?? "사주 풀이"}’
          </h1>
        </div>
        <div className="px-5 pb-5 flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
              {tag}
            </span>
          ))}
        </div>
        {generalQuestion && (
          <div className="px-5 pb-5 text-center">
            <p className="text-xs text-white leading-relaxed">
              Q. {generalQuestion}
            </p>
          </div>
        )}
      </header>

      <section>
        <MyeongsikTable myeongsik={myeongsik} />
      </section>

      <article className="rounded-b-2xl overflow-hidden">
        <AccordionBody markdown={result.interpretation_md} headerTitle={(product?.slug === "realestate-saju" || product?.slug === "romance-saju" || product?.slug === "job-saju" || product?.slug === "business-saju") ? "해설" : "질문 해설"} limit={13} />
      </article>

      {isOwner && <ShareRewardCard resultId={result.id} />}

        <OtherProducts currentSlug={product?.slug} />

      <footer className="mt-10 text-center">
        <p className="text-xs text-muted-foreground">냥점 · 본 결과는 참고용이며 전문 상담을 대체하지 않습니다</p>
      </footer>
    </div>
  );
}
