"use client";

import { useState } from "react";

type Section = { title: string; content: string };

function parseSections(markdown: string): Section[] {
  const parts = markdown.split(/\n(?=## )/);
  const sections: Section[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("## ")) continue;
    const newlineIdx = trimmed.indexOf("\n");
    if (newlineIdx === -1) continue;
    const title = trimmed.slice(3, newlineIdx).trim();
    const content = trimmed.slice(newlineIdx + 1).trim();
    if (title && content) sections.push({ title, content });
  }
  return sections;
}

export function AccordionBody({
  markdown,
  headerTitle = "사주 해설",
  headerColor = "#1a1a1a",
  showHeader = true,
  limit,
}: {
  markdown: string;
  headerTitle?: string;
  headerColor?: string;
  showHeader?: boolean;
  limit?: number;
}) {
  const allSections = parseSections(markdown);
  const sections = limit ? allSections.slice(0, limit) : allSections;
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (allSections.length === 0) {
    return <p className="text-sm text-muted-foreground">{markdown}</p>;
  }

  return (
    <div className="divide-y divide-border">
      {/* 헤더 (선택) */}
      {showHeader && (
        <div className="px-5 py-4 text-center" style={{ background: headerColor }}>
          <p className="text-sm font-semibold tracking-widest text-white">{headerTitle}</p>
          <p className="mt-1 text-xs text-white/50">각 제목을 클릭하면 해설이 펼쳐져요</p>
        </div>
      )}

      {/* 아이템 목록 */}
      <ul className="divide-y divide-border">
        {sections.map((sec, i) => {
          const isOpen = openIdx === i;
          return (
            <li key={i}>
              {/* 제목 행 */}
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#fafafa] transition-colors"
              >
                <span className="flex-1 text-sm font-medium text-ink leading-relaxed">
                  {sec.title}
                </span>
                <svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <circle cx="10" cy="10" r="9" fill={isOpen ? "#000" : "#f0f0f0"} />
                  <path
                    d="M6.5 8.5 L10 12 L13.5 8.5"
                    stroke={isOpen ? "#fff" : "#999"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* 본문 */}
              {isOpen && (
                <div className="px-5 pb-6 pt-1 bg-[#fafafa] border-t border-border">
                  {sec.content.split("\n\n").map((para, pi) => (
                    <p
                      key={pi}
                      className="text-sm text-[#3a3a3a] leading-[1.95] mb-4 last:mb-0"
                    >
                      {para.replace(/^[-•]\s?/, "")}
                    </p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

