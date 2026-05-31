"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h2: ({ children }) => (
    <div className="result-section-wrapper">
      <div className="result-section-header">
        <span className="result-section-bar" />
        <h2>{children}</h2>
      </div>
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="result-h3">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="result-p">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="result-ul">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="result-li">
      <span className="result-li-dot" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="result-strong">{children}</strong>
  ),
};

export function ResultBody({ markdown }: { markdown: string }) {
  return (
    <div className="result-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
