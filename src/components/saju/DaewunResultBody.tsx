"use client";

import { useState } from "react";

type Preview = { title: string; desc: string };
type Detail  = { icon: string; title: string; sub: string; content: string };
type Yearly  = { label: string; preview: string; content: string };
type Final   = { icon: string; title: string; sub: string; content: string };
type Parsed  = { preview: Preview; details: Detail[]; yearly: Yearly[]; final: Final | null };

/** 마크다운 기호·따옴표 제거 */
function stripMeta(s: string): string {
  return s
    .replace(/^#+\s*/, "")           // 앞 # 기호
    .replace(/\*\*/g, "")            // bold **
    .replace(/["'«»‘-‟‹›❛-❞〝-〟＂＇]/g, "") // 모든 종류 따옴표
    .replace(/^\[부제[:\s]*/, "").replace(/\]$/, "") // [부제:...] 태그
    .replace(/^\[/, "").replace(/\]$/, "")           // 대괄호
    .trim();
}

function parseDaewun(md: string): Parsed {
  const result: Parsed = {
    preview: { title: "", desc: "" },
    details: [],
    yearly: [],
    final: null,
  };

  const majorSections = md.split(/\n(?=## )/);

  for (const sec of majorSections) {
    const lines = sec.trim().split("\n");
    const heading = lines[0].replace(/^## /, "").trim();
    const body = lines.slice(1).join("\n");

    if (heading.includes("미리보기")) {
      const titleM = body.match(/### 제목\n([^\n]+)/);
      const descM  = body.match(/### 설명\n([\s\S]+?)(?=\n### |\n## |$)/);
      result.preview.title = titleM?.[1]?.trim() ?? "";
      result.preview.desc  = descM?.[1]?.trim() ?? "";
      if (!result.preview.title) {
        // 제목/설명 태그 없이 그냥 줄로 왔을 때 fallback
        const bodyLines = body.trim().split("\n").filter(Boolean);
        result.preview.title = bodyLines[0] ?? "";
        result.preview.desc  = bodyLines.slice(1).join(" ").trim();
      }
    } else if (heading.includes("상세 해설")) {
      const subSecs = body.split(/\n(?=### )/);
      for (const sub of subSecs) {
        if (!sub.trim().startsWith("###")) continue;
        const sLines = sub.trim().split("\n");
        const rawTitle = sLines[0].replace(/^### /, "").trim();
        // emoji 분리
        const emojiM = rawTitle.match(/^([\u{1F300}-\u{1FFFF}✦◈◉◆◇◎★☆💫🌿🔥🌙⭐💎🌺🎯🍀🌸])\s*(.+)/u);
        const icon  = emojiM?.[1] ?? "";
        const title = emojiM?.[2]?.trim() ?? rawTitle;
        // 두 번째 줄: 부제 (마크다운 기호 제거)
        const subLine = stripMeta(sLines[1] ?? "");
        const content = sLines.slice(2).join("\n").trim();
        if (title) result.details.push({ icon, title, sub: subLine, content });
      }
    } else if (heading.includes("연도별")) {
      const subSecs = body.split(/\n(?=### )/);
      for (const sub of subSecs) {
        if (!sub.trim().startsWith("###")) continue;
        const sLines = sub.trim().split("\n");
        const label   = sLines[0].replace(/^### /, "").trim();
        const preview = stripMeta(sLines[1] ?? "");
        const content = sLines.slice(2).join("\n").replace(/^\[/, "").replace(/\]$/, "").trim();
        if (!label) continue;

        // YYYY년 패턴이 아닌 항목(소제목)은 앞 연도 항목에 병합
        const isYearLabel = /\d{4}년/.test(label);
        if (!isYearLabel && result.yearly.length > 0) {
          const prev = result.yearly[result.yearly.length - 1];
          if (!prev.preview) prev.preview = label;
          const extra = [preview, content].filter(Boolean).join("\n\n");
          if (extra) prev.content = [prev.content, extra].filter(Boolean).join("\n\n");
        } else {
          result.yearly.push({ label, preview, content });
        }
      }
    } else if (heading.includes("마지막")) {
      // ### 제목 줄 파싱
      const fLines = body.trim().split("\n");
      const firstLine = fLines[0] ?? "";
      if (firstLine.startsWith("###")) {
        const rawTitle = firstLine.replace(/^### /, "").trim();
        const emojiM = rawTitle.match(/^([\u{1F300}-\u{1FFFF}✦✨◈◉◆◇◎★☆💫🌿🔥🌙⭐💎🌺🎯🍀🌸])\s*(.+)/u);
        const icon    = emojiM?.[1] ?? "";
        const title   = emojiM?.[2]?.trim() ?? rawTitle;
        const sub = stripMeta(fLines[1] ?? "");
        const content = fLines.slice(2).join("\n").trim();
        result.final = { icon, title, sub, content };
      } else {
        // 구조 없는 fallback
        result.final = { icon: "", title: "마지막 한마디", sub: "", content: body.trim() };
      }
    }
  }

  return result;
}

export function DaewunResultBody({ markdown }: { markdown: string }) {
  const parsed = parseDaewun(markdown);
  const [openPreview, setOpenPreview] = useState(false);
  const [openIdx, setOpenIdx]         = useState<number | null>(null);
  const [openYearIdx, setOpenYearIdx] = useState<number | null>(null);
  const [openFinal, setOpenFinal]     = useState(false);

  // 파싱 실패 시 raw 텍스트 표시
  if (!parsed.preview.title && parsed.details.length === 0 && parsed.yearly.length === 0 && !parsed.final) {
    return (
      <div className="px-5 py-6 text-sm text-body leading-relaxed whitespace-pre-wrap">
        {markdown}
      </div>
    );
  }

  return (
    <div>
      {/* ── 미리보기 ── */}
      {parsed.preview.title && (
        <div className="border-b border-border">
          <button
            type="button"
            onClick={() => setOpenPreview(!openPreview)}
            className="w-full relative px-8 py-5 text-center hover:bg-[#fafafa] transition-colors"
          >
            <p className="text-sm font-semibold text-ink leading-snug">
              {parsed.preview.title}
            </p>
            <svg
              width="20" height="20" viewBox="0 0 20 20" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200"
              style={{ transform: openPreview ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
            >
              <circle cx="10" cy="10" r="9" fill={openPreview ? "#000" : "#f0f0f0"} />
              <path d="M6.5 8.5 L10 12 L13.5 8.5" stroke={openPreview ? "#fff" : "#999"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {openPreview && parsed.preview.desc && (
            <div className="px-5 pb-5 pt-1 bg-[#fafafa] border-t border-border">
              <p className="text-sm text-[#3a3a3a] leading-[1.95]">{parsed.preview.desc}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 상세 해설 ── */}
      {parsed.details.length > 0 && (
        <div className="border-t-2 border-border">
          {/* 섹션 헤더 */}
          <ul className="divide-y divide-border">
            {parsed.details.map((d, i) => {
              const isOpen = openIdx === i;
              return (
                <li key={i}>
                  {/* 닫힌 상태: 제목+부제 가운데 정렬 */}
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full relative px-8 py-5 text-center hover:bg-[#fafafa] transition-colors"
                  >
                    <p className="text-sm font-semibold text-ink">
                      {d.title}
                    </p>
                    {d.sub && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {d.sub}
                      </p>
                    )}
                    {/* 화살표 우측 고정 */}
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200"
                      style={{ transform: isOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
                    >
                      <circle cx="10" cy="10" r="9" fill={isOpen ? "#000" : "#f0f0f0"} />
                      <path d="M6.5 8.5 L10 12 L13.5 8.5" stroke={isOpen ? "#fff" : "#999"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* 펼친 상태 */}
                  {isOpen && (
                    <div className="border-t border-border bg-white">
                      <div className="px-5 py-5">
                        {d.content.split("\n\n").map((para, pi) => (
                          <p key={pi} className="text-sm text-[#3a3a3a] leading-[1.95] mb-4 last:mb-0">
                            {para.replace(/^#+\s*/, "").replace(/^[-•]\s?/, "").replace(/\*\*/g, "")}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── 연도별 해설 ── */}
      {parsed.yearly.length > 0 && (
        <div className="border-t-2 border-border">
          <ul className="divide-y divide-border">
            {parsed.yearly.map((y, i) => {
              const isOpen = openYearIdx === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenYearIdx(isOpen ? null : i)}
                    className="w-full relative px-8 py-5 text-center hover:bg-[#fafafa] transition-colors"
                  >
                    <p className="text-sm font-semibold text-ink">{y.label}</p>
                    {y.preview && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {y.preview.length > 60 ? y.preview.slice(0, 60) + "…" : y.preview}
                      </p>
                    )}
                    <svg
                      width="20" height="20" viewBox="0 0 20 20" fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200"
                      style={{ transform: isOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
                    >
                      <circle cx="10" cy="10" r="9" fill={isOpen ? "#000" : "#f0f0f0"} />
                      <path d="M6.5 8.5 L10 12 L13.5 8.5" stroke={isOpen ? "#fff" : "#999"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {isOpen && y.content && (
                    <div className="px-5 pb-5 pt-4 bg-white border-t border-border">
                      {y.content.split("\n\n").map((para, pi) => (
                        <p key={pi} className="text-sm text-[#3a3a3a] leading-[1.95] mb-3 last:mb-0">
                          {para.replace(/^#+\s*/, "").replace(/^\[/, "").replace(/\]$/, "").replace(/^[-•]\s?/, "")}
                        </p>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── 마지막 한마디 ── */}
      {parsed.final && (
        <div className="border-t-2 border-border">
          {/* 섹션 헤더 */}

          {/* 아코디언 아이템 */}
          <button
            type="button"
            onClick={() => setOpenFinal(!openFinal)}
            className="w-full relative px-8 py-5 text-center hover:bg-[#fafafa] transition-colors"
          >
            <p className="text-sm font-semibold text-ink">
              시크릿 솔루션
            </p>
            {parsed.final.sub && (
              <p className="mt-1 text-sm text-muted-foreground">
                {parsed.final.sub.length > 40 ? parsed.final.sub.slice(0, 40) + "…" : parsed.final.sub}
              </p>
            )}
            <svg
              width="20" height="20" viewBox="0 0 20 20" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200"
              style={{ transform: openFinal ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
            >
              <circle cx="10" cy="10" r="9" fill={openFinal ? "#000" : "#f0f0f0"} />
              <path d="M6.5 8.5 L10 12 L13.5 8.5" stroke={openFinal ? "#fff" : "#999"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 펼친 상태 */}
          {openFinal && (
            <div className="border-t border-border bg-white">
              <div className="px-5 py-5">
                {parsed.final.content.split("\n\n").map((para, pi) => (
                  <p key={pi} className="text-sm text-[#3a3a3a] leading-[1.95] mb-4 last:mb-0">
                    {para.replace(/^#+\s*/, "").replace(/^[-•]\s?/, "")}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
