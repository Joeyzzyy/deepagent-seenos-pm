"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertCircle,
  Loader2,
  CircleCheckBigIcon,
  StopCircle,
  Eye,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCall, ActionRequest, ReviewConfig } from "@/app/types/types";
import { cn } from "@/lib/utils";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { ToolApprovalInterrupt } from "@/app/components/ToolApprovalInterrupt";

interface ToolCallBoxProps {
  toolCall: ToolCall;
  uiComponent?: any;
  stream?: any;
  graphId?: string;
  actionRequest?: ActionRequest;
  reviewConfig?: ReviewConfig;
  onResume?: (value: any) => void;
  isLoading?: boolean;
}

export const ToolCallBox = React.memo<ToolCallBoxProps>(
  ({
    toolCall,
    uiComponent,
    stream,
    graphId,
    actionRequest,
    reviewConfig,
    onResume,
    isLoading,
  }) => {
    const [isExpanded, setIsExpanded] = useState(
      () => !!uiComponent || !!actionRequest
    );
    const [expandedArgs, setExpandedArgs] = useState<Record<string, boolean>>(
      {}
    );
    const [htmlViewMode, setHtmlViewMode] = useState<"preview" | "code">("preview");

    const { name, args, result, status } = useMemo(() => {
      return {
        name: toolCall.name || "Unknown Tool",
        args: toolCall.args || {},
        result: toolCall.result,
        status: toolCall.status || "completed",
      };
    }, [toolCall]);

    // Detect if result contains HTML content
    const htmlContent = useMemo(() => {
      if (!result) return null;
      
      // Try to parse result as JSON if it's a string
      let parsedResult = result;
      if (typeof result === "string") {
        try {
          parsedResult = JSON.parse(result);
        } catch {
          // Not JSON, keep as string
          parsedResult = result;
        }
      }
      
      // Check if parsed result has html_content field
      if (typeof parsedResult === "object" && parsedResult !== null && "html_content" in parsedResult) {
        return parsedResult.html_content as string;
      }
      
      // Fallback: check if result string contains complete HTML document
      const resultStr = typeof result === "string" ? result : JSON.stringify(result);
      if (resultStr.includes("<!DOCTYPE html>") || 
          (resultStr.includes("<html") && resultStr.includes("</html>"))) {
        return resultStr;
      }
      
      return null;
    }, [result]);

    // Get summary for specific tools to display inline
    const toolSummary = useMemo(() => {
      const toolArgs = toolCall.args || {};
      switch (toolCall.name) {
        case "write_file":
        case "read_file":
        case "edit_file":
        case "ls":
        case "glob":
        case "grep":
          return toolArgs.path || toolArgs.file_path || toolArgs.filename || toolArgs.directory || null;
        case "fetch_url":
          return toolArgs.url || null;
        case "serp_search":
        case "serpapi_search":
        case "exa_search":
        case "tavily_search":
        case "tavily_crawl":
        case "perplexity_search":
        case "perplexity_chat":
          return toolArgs.query || toolArgs.q || toolArgs.message || toolArgs.messages?.[0]?.content || null;
        case "write_todos": {
          const todos = toolArgs.todos as Array<{ status?: string }> | undefined;
          if (todos && Array.isArray(todos)) {
            const completed = todos.filter(t => t.status === "completed").length;
            const total = todos.length;
            return `(${completed}/${total})`;
          }
          return null;
        }
        default:
          return null;
      }
    }, [toolCall]);

    const statusIcon = useMemo(() => {
      switch (status) {
        case "completed":
          return (
            <CircleCheckBigIcon
              size={14}
              className="text-emerald-500"
            />
          );
        case "error":
          return (
            <AlertCircle
              size={14}
              className="text-destructive"
            />
          );
        case "pending":
          return (
            <Loader2
              size={14}
              className="text-amber-500 animate-spin"
            />
          );
        case "interrupted":
          return (
            <StopCircle
              size={14}
              className="text-orange-500"
            />
          );
        default:
          return (
            <Terminal
              size={14}
              className="text-muted-foreground/50"
            />
          );
      }
    }, [status]);

    const toggleExpanded = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const toggleArgExpanded = useCallback((argKey: string) => {
      setExpandedArgs((prev) => ({
        ...prev,
        [argKey]: !prev[argKey],
      }));
    }, []);

    const hasContent = result || Object.keys(args).length > 0;

    return (
      <div
        className={cn(
          "w-full overflow-hidden rounded-md transition-colors duration-150",
          "border border-transparent hover:border-border/50 hover:bg-muted/30",
          isExpanded && hasContent && "bg-muted/40 border-border/50"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className={cn(
            "flex w-full items-center gap-2 px-2.5 py-1.5 h-auto text-left",
            "border-none shadow-none outline-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "disabled:cursor-default justify-start"
          )}
          disabled={!hasContent}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-4 h-4 rounded flex items-center justify-center bg-muted/80">
              {statusIcon}
            </div>
            <code className="text-[11px] font-mono text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded">
              {name}
            </code>
          </div>
          {toolSummary && (
            <span className="flex-1 text-[11px] text-muted-foreground/60 truncate min-w-0 ml-1">
              {toolSummary}
            </span>
          )}
          {hasContent &&
            (isExpanded ? (
              <ChevronUp
                size={12}
                className="shrink-0 text-muted-foreground/50 ml-auto"
              />
            ) : (
              <ChevronDown
                size={12}
                className="shrink-0 text-muted-foreground/50 ml-auto"
              />
            ))}
        </Button>

        {isExpanded && hasContent && (
          <div className="px-4 pb-4">
            {uiComponent && stream && graphId ? (
              <div className="mt-4">
                <LoadExternalComponent
                  key={uiComponent.id}
                  stream={stream}
                  message={uiComponent}
                  namespace={graphId}
                  meta={{ status, args, result: result ?? "No Result Yet" }}
                />
              </div>
            ) : actionRequest && onResume ? (
              // Show tool approval UI when there's an action request but no GenUI
              <div className="mt-4">
                <ToolApprovalInterrupt
                  actionRequest={actionRequest}
                  reviewConfig={reviewConfig}
                  onResume={onResume}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <>
                {Object.keys(args).length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Arguments
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(args).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-sm border border-border"
                        >
                          <button
                            onClick={() => toggleArgExpanded(key)}
                            className="flex w-full items-center justify-between bg-muted/30 p-2 text-left text-xs font-medium transition-colors hover:bg-muted/50"
                          >
                            <span className="font-mono">{key}</span>
                            {expandedArgs[key] ? (
                              <ChevronUp
                                size={12}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <ChevronDown
                                size={12}
                                className="text-muted-foreground"
                              />
                            )}
                          </button>
                          {expandedArgs[key] && (
                            <div className="border-t border-border bg-muted/20 p-2 max-h-[150px] overflow-auto">
                              <pre className="m-0 whitespace-pre-wrap break-all font-mono text-[10px] leading-5 text-foreground">
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(result || htmlContent) && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Result
                      </h4>
                      {htmlContent && (
                        <div className="flex gap-1">
                          <Button
                            onClick={() => setHtmlViewMode("preview")}
                            variant={htmlViewMode === "preview" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Preview
                          </Button>
                          <Button
                            onClick={() => setHtmlViewMode("code")}
                            variant={htmlViewMode === "code" ? "default" : "ghost"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Code size={12} className="mr-1" />
                            Code
                          </Button>
                        </div>
                      )}
                    </div>
                    {(() => {
                      if (htmlContent && htmlViewMode === "preview") {
                        return (
                          <div className="h-[600px] rounded-md border border-border bg-white overflow-hidden">
                            <iframe
                              srcDoc={htmlContent}
                              title="HTML Preview"
                              className="h-full w-full"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          </div>
                        );
                      }
                      
                      return (
                        <pre className="m-0 max-h-[200px] overflow-auto whitespace-pre-wrap break-all rounded-sm border border-border bg-muted/40 p-2 font-mono text-[10px] leading-5 text-foreground">
                          {(() => {
                            // If we have HTML content, show formatted info without the full HTML
                            if (htmlContent) {
                              try {
                                const parsed = typeof result === "string" ? JSON.parse(result) : result;
                                if (parsed && typeof parsed === "object" && "html_content" in parsed) {
                                  const { html_content, ...metadata } = parsed;
                                  return JSON.stringify({
                                    ...metadata,
                                    html_preview: `[HTML content hidden, ${html_content.length} characters]`
                                  }, null, 2);
                                }
                              } catch {
                                // Fall through to default display
                              }
                            }
                            // Default display
                            return typeof result === "string"
                              ? result
                              : JSON.stringify(result, null, 2);
                          })()}
                        </pre>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

ToolCallBox.displayName = "ToolCallBox";
