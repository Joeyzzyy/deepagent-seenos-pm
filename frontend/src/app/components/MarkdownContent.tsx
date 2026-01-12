"use client";

import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** Maximum height before showing "expand" button (default: 400px) */
  maxCollapsedHeight?: number;
}

export const MarkdownContent = React.memo<MarkdownContentProps>(
  ({ content, className = "", maxCollapsedHeight = 400 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Check if content is long enough to need collapsing
    // Estimate by line count and character length
    const isLongContent = useMemo(() => {
      const lineCount = content.split('\n').length;
      const charCount = content.length;
      // Consider long if more than 30 lines or 2000 characters
      return lineCount > 30 || charCount > 2000;
    }, [content]);
    
    const shouldCollapse = isLongContent && !isExpanded;
    
    return (
      <div className="relative">
        <div
          className={cn(
            "prose min-w-0 max-w-full overflow-hidden break-words text-sm leading-relaxed text-inherit [&_h1:first-child]:mt-0 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:font-semibold [&_h2:first-child]:mt-0 [&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:font-semibold [&_h3:first-child]:mt-0 [&_h3]:mb-4 [&_h3]:mt-6 [&_h3]:font-semibold [&_h4:first-child]:mt-0 [&_h4]:mb-4 [&_h4]:mt-6 [&_h4]:font-semibold [&_h5:first-child]:mt-0 [&_h5]:mb-4 [&_h5]:mt-6 [&_h5]:font-semibold [&_h6:first-child]:mt-0 [&_h6]:mb-4 [&_h6]:mt-6 [&_h6]:font-semibold [&_p:last-child]:mb-0 [&_p]:mb-4",
            shouldCollapse && "overflow-y-hidden",
            className
          )}
          style={shouldCollapse ? { maxHeight: `${maxCollapsedHeight}px` } : undefined}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({
                inline,
                className,
                children,
                ...props
              }: {
                inline?: boolean;
                className?: string;
                children?: React.ReactNode;
              }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                    className="max-w-full rounded-md border border-slate-200 text-sm"
                    wrapLines={true}
                    wrapLongLines={true}
                    lineProps={{
                      style: {
                        wordBreak: "break-all",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                      },
                    }}
                    customStyle={{
                      margin: 0,
                      maxWidth: "100%",
                      overflowX: "auto",
                      fontSize: "0.875rem",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-700"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre({ children }: { children?: React.ReactNode }) {
                return (
                  <div className="my-4 max-w-full overflow-hidden last:mb-0">
                    {children}
                  </div>
                );
              },
              a({
                href,
                children,
              }: {
                href?: string;
                children?: React.ReactNode;
              }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 no-underline hover:underline"
                  >
                    {children}
                  </a>
                );
              },
              blockquote({ children }: { children?: React.ReactNode }) {
                return (
                  <blockquote className="my-4 border-l-4 border-slate-300 pl-4 italic text-slate-600">
                    {children}
                  </blockquote>
                );
              },
              ul({ children }: { children?: React.ReactNode }) {
                return (
                  <ul className="my-4 pl-6 [&>li:last-child]:mb-0 [&>li]:mb-1">
                    {children}
                  </ul>
                );
              },
              ol({ children }: { children?: React.ReactNode }) {
                return (
                  <ol className="my-4 pl-6 [&>li:last-child]:mb-0 [&>li]:mb-1">
                    {children}
                  </ol>
                );
              },
              table({ children }: { children?: React.ReactNode }) {
                return (
                  <div className="my-4 overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full border-collapse text-sm [&_td]:border-t [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-700">
                      {children}
                    </table>
                  </div>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        
        {/* Gradient overlay and expand button for long content */}
        {isLongContent && (
          <>
            {shouldCollapse && (
              <div className="pointer-events-none absolute bottom-8 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} />
                  收起内容
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  展开完整内容
                </>
              )}
            </button>
          </>
        )}
      </div>
    );
  }
);

MarkdownContent.displayName = "MarkdownContent";
