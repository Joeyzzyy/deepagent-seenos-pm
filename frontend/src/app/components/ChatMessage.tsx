"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Copy, Check, Loader2, PlayCircle, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";
import { SubAgentIndicator } from "@/app/components/SubAgentIndicator";
import { ToolCallBox } from "@/app/components/ToolCallBox";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { FileViewDialog } from "@/app/components/FileViewDialog";
import { PhaseStatusMessage } from "@/app/components/PhaseStatusMessage";
import type {
  SubAgent,
  ToolCall,
  ActionRequest,
  ReviewConfig,
  FileItem,
} from "@/app/types/types";
import { Message } from "@langchain/langgraph-sdk";
import {
  extractSubAgentContent,
  extractStringFromMessageContent,
} from "@/app/utils/utils";
import { cn } from "@/lib/utils";

// Helper to parse phase status from message content
interface PhaseStatus {
  type: "phase_status";
  phase: number;
  status: "started" | "progress" | "completed" | "error";
  summary?: string | null;
  duration?: string | null;
}

function parsePhaseStatus(content: string): PhaseStatus | null {
  const match = content.match(/__PHASE_STATUS__(.+?)__/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return parsed as PhaseStatus;
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to detect and extract Playbook info from long prompts
function extractPlaybookInfo(content: string): { isPlaybook: boolean; title: string; params: Record<string, string> } | null {
  // Detect common Playbook patterns
  const playbookPatterns = [
    { pattern: /You are an expert SEO Competitive Intelligence Analyst/i, title: "Competitor Growth Engine Audit" },
    { pattern: /You are an expert/i, title: "Playbook Analysis" },
  ];

  // Only consider as Playbook if content is very long (likely a template)
  if (content.length < 1000) return null;

  for (const { pattern, title } of playbookPatterns) {
    if (pattern.test(content)) {
      // Extract key parameters from the prompt
      const params: Record<string, string> = {};
      
      // Try to extract competitor domains
      const competitorMatch = content.match(/\*\*Competitor Domains.*?:\*\*\s*([\s\S]*?)(?:\n\n|\*\*)/);
      if (competitorMatch) {
        const domains = competitorMatch[1].trim().replace(/^\d+\.\s*/gm, '').split('\n').filter(d => d.trim());
        if (domains.length > 0) {
          params.competitors = domains.join(', ');
        }
      }

      // Try to extract my domain
      const myDomainMatch = content.match(/\*\*My Domain.*?:\*\*\s*([^\n*]+)/);
      if (myDomainMatch && myDomainMatch[1].trim()) {
        params.myDomain = myDomainMatch[1].trim();
      }

      // Try to extract market
      const marketMatch = content.match(/\*\*Primary Market:\*\*\s*(\w+)/);
      if (marketMatch) {
        params.market = marketMatch[1].toUpperCase();
      }

      return { isPlaybook: true, title, params };
    }
  }

  return null;
}

interface ChatMessageProps {
  message: Message;
  toolCalls: ToolCall[];
  isLoading?: boolean;
  actionRequestsMap?: Map<string, ActionRequest>;
  reviewConfigsMap?: Map<string, ReviewConfig>;
  ui?: any[];
  stream?: any;
  onResumeInterrupt?: (value: any) => void;
  graphId?: string;
  allMessages?: Message[]; // 新增：用于获取phase详情
}

export const ChatMessage = React.memo<ChatMessageProps>(
  ({
    message,
    toolCalls,
    isLoading,
    actionRequestsMap,
    reviewConfigsMap,
    ui,
    stream,
    onResumeInterrupt,
    graphId,
    allMessages = [],
  }) => {
    const isUser = message.type === "human";
    const messageContent = extractStringFromMessageContent(message);
    const hasContent = messageContent && messageContent.trim() !== "";
    const hasToolCalls = toolCalls.length > 0;
    
    // Check if this is a phase status message
    const phaseStatus = useMemo(() => {
      if (isUser) return null;
      return parsePhaseStatus(messageContent);
    }, [isUser, messageContent]);
    
    // Extract phase details from messages between "started" and "completed" status
    const phaseDetails = useMemo(() => {
      if (!phaseStatus || phaseStatus.status !== "completed" || allMessages.length === 0) {
        return null;
      }
      
      // Find current completed message index
      const completedIndex = allMessages.findIndex(m => m.id === message.id);
      if (completedIndex === -1) return null;
      
      // Find the corresponding "started" message for this phase (search backwards)
      let startedIndex = -1;
      for (let i = completedIndex - 1; i >= 0; i--) {
        const content = extractStringFromMessageContent(allMessages[i]);
        const status = parsePhaseStatus(content);
        if (status && status.phase === phaseStatus.phase && status.status === 'started') {
          startedIndex = i;
          break;
        }
      }
      
      // If no started message found, return null
      if (startedIndex === -1) return null;
      
      // Collect only AI messages between started and completed (tool messages stay in main chat)
      const detailMessages: string[] = [];
      for (let i = startedIndex + 1; i < completedIndex; i++) {
        const msg = allMessages[i];
        // Only collect AI messages, not tool messages (they're visible in main chat)
        if (msg.type === "ai") {
          const content = extractStringFromMessageContent(msg);
          // Skip any other phase status messages and empty content
          if (!parsePhaseStatus(content) && content.trim()) {
            detailMessages.push(content);
          }
        }
      }
      
      console.log(`[ChatMessage] Phase ${phaseStatus.phase} details:`, {
        startedIndex,
        completedIndex,
        messagesCollected: detailMessages.length,
        totalLength: detailMessages.join('').length
      });
      
      // Join with double newlines only (no horizontal rule divider)
      return detailMessages.length > 0 ? detailMessages.join("\n\n") : null;
    }, [phaseStatus, allMessages, message.id]);
    
    const subAgents = useMemo(() => {
      return toolCalls
        .filter((toolCall: ToolCall) => {
          return (
            toolCall.name === "task" &&
            toolCall.args["subagent_type"] &&
            toolCall.args["subagent_type"] !== "" &&
            toolCall.args["subagent_type"] !== null
          );
        })
        .map((toolCall: ToolCall) => {
          const subagentType = (toolCall.args as Record<string, unknown>)[
            "subagent_type"
          ] as string;
          return {
            id: toolCall.id,
            name: toolCall.name,
            subAgentName: subagentType,
            input: toolCall.args,
            output: toolCall.result ? { result: toolCall.result } : undefined,
            status: toolCall.status,
          } as SubAgent;
        });
    }, [toolCalls]);

    const [expandedSubAgents, setExpandedSubAgents] = useState<
      Record<string, boolean>
    >({});
    const [copySuccess, setCopySuccess] = useState(false);
    const [playbookExpanded, setPlaybookExpanded] = useState(false);
    const [previewHtmlFile, setPreviewHtmlFile] = useState<FileItem | null>(null);
    const [toolCallsExpanded, setToolCallsExpanded] = useState(false);
    
    // Filter out "task" tool calls for display count
    const displayableToolCalls = useMemo(() => 
      toolCalls.filter((tc: ToolCall) => tc.name !== "task"), 
      [toolCalls]
    );
    const TOOL_CALLS_THRESHOLD = 3;
    const hasMoreToolCalls = displayableToolCalls.length > TOOL_CALLS_THRESHOLD;

    // Extract HTML content from tool calls for auto-preview
    const htmlReports = useMemo(() => {
      return toolCalls
        .map((toolCall) => {
          if (!toolCall.result) return null;
          
          let result: any = toolCall.result;
          // Try to parse if it's a JSON string
          if (typeof result === "string") {
            try {
              result = JSON.parse(result);
            } catch {
              return null;
            }
          }
          
          // Check if result has html_content field
          if (typeof result === "object" && result !== null && "html_content" in result) {
            return {
              id: toolCall.id,
              toolName: toolCall.name,
              title: (result.title as string) || "Report",
              htmlContent: result.html_content as string,
            };
          }
          
          return null;
        })
        .filter((report): report is NonNullable<typeof report> => report !== null);
    }, [toolCalls]);

    // Check if this is a Playbook prompt
    const playbookInfo = useMemo(() => {
      if (!isUser) return null;
      return extractPlaybookInfo(messageContent);
    }, [isUser, messageContent]);

    const isSubAgentExpanded = useCallback(
      (id: string) => expandedSubAgents[id] ?? false,
      [expandedSubAgents]
    );
    const toggleSubAgent = useCallback((id: string) => {
      setExpandedSubAgents((prev) => ({
        ...prev,
        [id]: prev[id] === undefined ? false : !prev[id],
      }));
    }, []);

    const handleCopyMessage = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(messageContent);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy message:", err);
      }
    }, [messageContent]);

    // If this is a phase status message, render the special component
    if (phaseStatus) {
      return (
        <div className="w-full">
          <PhaseStatusMessage 
            data={phaseStatus} 
            phaseDetails={phaseDetails}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex w-full max-w-full overflow-x-hidden",
          isUser && "flex-row-reverse"
        )}
      >
        <div
          className={cn(
            "min-w-0 max-w-full",
            isUser ? "max-w-[70%]" : "w-full"
          )}
        >
          {hasContent && (
            <div className={cn("group/message relative flex items-end gap-0")}>
              <div
                className={cn(
                  "mt-4 overflow-hidden break-words text-sm font-normal leading-[150%]",
                  isUser
                    ? "rounded-xl rounded-br-none border border-border px-3 py-2 text-foreground"
                    : "text-primary"
                )}
                style={
                  isUser
                    ? { backgroundColor: "var(--color-user-message-bg)" }
                    : undefined
                }
              >
                {isUser ? (
                  playbookInfo ? (
                    // Collapsed Playbook view
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <PlayCircle size={16} className="text-primary flex-shrink-0" />
                        <span className="font-medium">{playbookInfo.title}</span>
                      </div>
                      {Object.keys(playbookInfo.params).length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {playbookInfo.params.competitors && (
                            <span>📊 <strong>Competitors:</strong> {playbookInfo.params.competitors}</span>
                          )}
                          {playbookInfo.params.myDomain && (
                            <span>🏠 <strong>My Domain:</strong> {playbookInfo.params.myDomain}</span>
                          )}
                          {playbookInfo.params.market && (
                            <span>🌍 <strong>Market:</strong> {playbookInfo.params.market}</span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPlaybookExpanded(!playbookExpanded)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {playbookExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {playbookExpanded ? "Hide full prompt" : "Show full prompt"}
                      </button>
                      {playbookExpanded && (
                        <div className="mt-2 max-h-[300px] overflow-y-auto rounded border border-border bg-muted/30 p-2 text-xs">
                          <pre className="whitespace-pre-wrap break-words">{messageContent}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {messageContent}
                    </p>
                  )
                ) : hasContent ? (
                  <MarkdownContent content={messageContent} />
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleCopyMessage}
                className={cn(
                  "absolute rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover/message:opacity-100",
                  isUser ? "right-full mr-1 top-4" : "right-0 top-4"
                )}
                title="Copy message"
              >
                {copySuccess ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
            </div>
          )}
          {hasToolCalls && (
            <div className="mt-4 flex w-full flex-col gap-1 relative">
              {displayableToolCalls.map((toolCall: ToolCall, index: number) => {
                // If collapsed and beyond threshold, don't render
                if (!toolCallsExpanded && hasMoreToolCalls && index >= TOOL_CALLS_THRESHOLD) {
                  return null;
                }
                
                const toolCallGenUiComponent = ui?.find(
                  (u) => u.metadata?.tool_call_id === toolCall.id
                );
                const actionRequest = actionRequestsMap?.get(toolCall.name);
                const reviewConfig = reviewConfigsMap?.get(toolCall.name);
                
                // Apply fade effect to last 2 visible items when collapsed
                const isFading = !toolCallsExpanded && hasMoreToolCalls && 
                  (index === TOOL_CALLS_THRESHOLD - 2 || index === TOOL_CALLS_THRESHOLD - 1);
                const fadeOpacity = isFading 
                  ? (index === TOOL_CALLS_THRESHOLD - 2 ? "opacity-60" : "opacity-30")
                  : "";
                
                return (
                  <div key={toolCall.id} className={cn("transition-opacity", fadeOpacity)}>
                    <ToolCallBox
                      toolCall={toolCall}
                      uiComponent={toolCallGenUiComponent}
                      stream={stream}
                      graphId={graphId}
                      actionRequest={actionRequest}
                      reviewConfig={reviewConfig}
                      onResume={onResumeInterrupt}
                      isLoading={isLoading}
                    />
                  </div>
                );
              })}
              
              {/* Expand/Collapse button for tool calls */}
              {hasMoreToolCalls && (
                <button
                  onClick={() => setToolCallsExpanded(!toolCallsExpanded)}
                  className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-1"
                >
                  {toolCallsExpanded ? (
                    <>Collapse tool calls</>
                  ) : (
                    <>Show all {displayableToolCalls.length} tool calls</>
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Auto-render HTML reports */}
          {!isUser && htmlReports.length > 0 && (
            <div className="mt-6 space-y-4">
              {htmlReports.map((report) => (
                <div key={report.id} className="rounded-lg border border-border bg-background/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="font-semibold text-sm text-foreground">
                        {report.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setPreviewHtmlFile({
                          path: `${report.title}.html`,
                          content: report.htmlContent
                        })}
                        className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
                        title="Open in full screen"
                      >
                        <Maximize2 size={14} />
                        Open Full Screen
                      </button>
                    </div>
                  </div>
                  <div className="h-[700px] bg-white">
                    <iframe
                      srcDoc={report.htmlContent}
                      title={report.title}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isUser && subAgents.length > 0 && (
            <div className="mt-4 flex w-full flex-col gap-1">
              {subAgents.map((subAgent) => {
                const isLoading = subAgent.status === "pending" || subAgent.status === "active";
                return (
                <div
                  key={subAgent.id}
                  className="flex w-full flex-col"
                >
                  <div className="flex items-end w-full">
                    <div className="flex-1 min-w-0">
                      <SubAgentIndicator
                        subAgent={subAgent}
                        taskSummary={extractSubAgentContent(subAgent.input)}
                        onClick={() => toggleSubAgent(subAgent.id)}
                        isExpanded={isSubAgentExpanded(subAgent.id)}
                      />
                    </div>
                  </div>
                  {isSubAgentExpanded(subAgent.id) && (
                    <div className="w-full max-w-full">
                      <div className="bg-surface border-border-light rounded-md border p-4">
                        <h4 className="text-primary/70 mb-2 text-xs font-semibold uppercase tracking-wider">
                          Input
                        </h4>
                        <div className="mb-4">
                          <MarkdownContent
                            content={extractSubAgentContent(subAgent.input)}
                          />
                        </div>
                        <h4 className="text-primary/70 mb-2 text-xs font-semibold uppercase tracking-wider">
                          Output
                        </h4>
                        {subAgent.output ? (
                          <MarkdownContent
                            content={extractSubAgentContent(subAgent.output)}
                          />
                        ) : isLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 size={14} className="animate-spin text-amber-500" />
                            <span className="text-sm">Running...</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No output yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* HTML Preview Dialog */}
        {previewHtmlFile && (
          <FileViewDialog
            file={previewHtmlFile}
            onClose={() => setPreviewHtmlFile(null)}
          />
        )}
      </div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";
