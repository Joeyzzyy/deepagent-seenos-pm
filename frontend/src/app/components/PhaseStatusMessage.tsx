"use client";

import React, { useState, useMemo } from "react";
import { Check, Loader2, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { cn } from "@/lib/utils";

interface PhaseStatus {
  type: "phase_status";
  phase: number;
  status: "started" | "progress" | "completed" | "error";
  summary?: string | null;
  duration?: string | null;
}

interface PhaseStatusMessageProps {
  data: PhaseStatus;
  phaseDetails?: string | null;
}

const PHASE_NAMES: Record<number, string> = {
  1: "Batch Overview",
  2: "Historical Trends",
  3: "Content & Technical SEO",
  4: "Keyword Gap Analysis",
  5: "Competitive Benchmark",
  6: "Root Cause Investigation",
  7: "Report Generation",
};

export function PhaseStatusMessage({ data, phaseDetails }: PhaseStatusMessageProps) {
  const [expanded, setExpanded] = useState(false);

  const phaseName = PHASE_NAMES[data.phase] || `Phase ${data.phase}`;
  const hasDetails = phaseDetails && phaseDetails.trim().length > 0;
  const canExpand = data.status === "completed" && hasDetails;

  const isRunning = data.status === "started" || data.status === "progress";
  const isCompleted = data.status === "completed";
  const isError = data.status === "error";

  return (
    <div className={cn(
      "my-4 animate-fadeInSlide",
      "rounded-xl border transition-all duration-300",
      isCompleted && "border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent",
      isRunning && "border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent",
      isError && "border-red-200/60 dark:border-red-800/40 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent"
    )}>
      <div className="px-4 py-3">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          {/* Phase Number Badge */}
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0",
            isCompleted && "bg-emerald-500 text-white",
            isRunning && "bg-blue-500 text-white",
            isError && "bg-red-500 text-white"
          )}>
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCompleted ? (
              <Check className="w-4 h-4" />
            ) : isError ? (
              <X className="w-4 h-4" />
            ) : (
              data.phase
            )}
          </div>
          
          {/* Phase Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-semibold text-sm",
                isCompleted && "text-emerald-700 dark:text-emerald-400",
                isRunning && "text-blue-700 dark:text-blue-400",
                isError && "text-red-700 dark:text-red-400"
              )}>
                {phaseName}
              </span>
              
              {data.duration && (
                <span className="text-[11px] text-muted-foreground/60 font-mono">
                  {data.duration}
                </span>
              )}
            </div>
            
            {/* Summary or Status */}
            {data.summary && isCompleted && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {data.summary}
              </p>
            )}
            
            {isRunning && (
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Analyzing...
              </p>
            )}
            
            {isError && data.summary && (
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5 line-clamp-1">
                {data.summary}
              </p>
            )}
          </div>
          
          {/* Expand Button */}
          {canExpand && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10",
                "border border-emerald-200/50 dark:border-emerald-700/30",
                "text-emerald-700 dark:text-emerald-400",
                "flex items-center gap-1"
              )}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Hide" : "View"}
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && canExpand && (
        <div className="border-t border-emerald-200/40 dark:border-emerald-800/30">
          <div className="px-4 py-3 max-h-[400px] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm prose-headings:text-base">
              <MarkdownContent content={phaseDetails || ""} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
