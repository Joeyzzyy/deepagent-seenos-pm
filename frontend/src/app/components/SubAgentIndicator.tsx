"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle, Circle } from "lucide-react";
import type { SubAgent } from "@/app/types/types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  taskSummary?: string;
  onClick: () => void;
  isExpanded?: boolean;
}

// Extract first line as task summary (no character truncation, let CSS handle it)
function getTaskSummary(content: string): string {
  if (!content) return "";
  // Get first line
  const firstLine = content.split("\n")[0].trim();
  // Remove markdown formatting
  return firstLine.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, taskSummary, onClick, isExpanded = false }) => {
    const summary = taskSummary ? getTaskSummary(taskSummary) : "";
    const isLoading = subAgent.status === "pending" || subAgent.status === "active";
    const isCompleted = subAgent.status === "completed";
    const isError = subAgent.status === "error";
    
    // Status icon (left side, like tool status)
    const statusIcon = isLoading ? (
      <Loader2 size={14} className="shrink-0 text-amber-500 animate-spin" />
    ) : isCompleted ? (
      <CheckCircle size={14} className="shrink-0 text-emerald-500" />
    ) : isError ? (
      <AlertCircle size={14} className="shrink-0 text-destructive" />
    ) : (
      <Circle size={14} className="shrink-0 text-muted-foreground/50" />
    );
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="flex w-full items-center gap-2 min-w-0 border-none px-3 py-2 text-left shadow-none outline-none transition-colors duration-200 hover:bg-accent justify-start"
      >
        {statusIcon}
        <span className="shrink-0 font-sans text-[15px] font-bold leading-[140%] tracking-[-0.6px] text-[#3F3F46]">
          {subAgent.subAgentName}
        </span>
        {summary && (
          <span className="flex-1 text-[13px] font-normal text-muted-foreground truncate">
            {summary}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        )}
      </Button>
    );
  }
);

SubAgentIndicator.displayName = "SubAgentIndicator";
