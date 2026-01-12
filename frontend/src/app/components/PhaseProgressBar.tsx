"use client";

import React from "react";
import { CheckCircle, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhaseProgressBarProps {
  currentPhase: number;
  completedPhases: number[];
  totalPhases?: number;
}

const PHASE_LABELS: Record<number, string> = {
  1: "Overview",
  2: "Trends",
  3: "Content",
  4: "Gap",
  5: "Benchmark",
  6: "RCA",
  7: "Report",
};

export function PhaseProgressBar({ 
  currentPhase, 
  completedPhases,
  totalPhases = 7 
}: PhaseProgressBarProps) {
  const phases = Array.from({ length: totalPhases }, (_, i) => i + 1);
  
  const getPhaseStatus = (phase: number) => {
    if (completedPhases.includes(phase)) {
      return "completed";
    } else if (phase === currentPhase) {
      return "current";
    } else {
      return "pending";
    }
  };

  return (
    <div className="flex gap-2 mb-4 p-3 rounded-lg bg-muted/30 border border-border">
      {phases.map((phase, index) => {
        const status = getPhaseStatus(phase);
        const label = PHASE_LABELS[phase] || `P${phase}`;
        
        return (
          <React.Fragment key={phase}>
            {/* Phase圆圈 */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  status === "completed" && "bg-green-500/90 dark:bg-green-600/80 text-white scale-100",
                  status === "current" && "bg-gray-400 dark:bg-gray-600 text-white animate-pulse scale-110",
                  status === "pending" && "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 scale-95"
                )}
              >
                {status === "completed" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : status === "current" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                status === "completed" && "text-green-600 dark:text-green-500",
                status === "current" && "text-gray-600 dark:text-gray-400",
                status === "pending" && "text-gray-500 dark:text-gray-500"
              )}>
                {label}
              </span>
            </div>
            
            {/* 连接线 */}
            {index < phases.length - 1 && (
              <div className="flex items-center pt-4">
                <div
                  className={cn(
                    "h-0.5 w-full transition-all duration-300",
                    completedPhases.includes(phase) && completedPhases.includes(phase + 1)
                      ? "bg-green-500/80 dark:bg-green-600/70"
                      : completedPhases.includes(phase)
                      ? "bg-gradient-to-r from-green-500/80 to-gray-300 dark:from-green-600/70 dark:to-gray-700"
                      : "bg-gray-300 dark:bg-gray-700"
                  )}
                  style={{ width: "100%", minWidth: "12px" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

