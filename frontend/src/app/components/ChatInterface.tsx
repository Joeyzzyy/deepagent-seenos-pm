"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  FormEvent,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Square,
  ArrowUp,
  MessageCircle,
  Copy,
  Check,
  CheckCircle,
  Circle,
  Loader2,
  ListTodo,
  ChevronUp,
} from "lucide-react";
import { ChatMessage } from "@/app/components/ChatMessage";
import type { ToolCall, ActionRequest, ReviewConfig } from "@/app/types/types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  formatConversationForLLM,
} from "@/app/utils/utils";
import { useChatContext } from "@/providers/ChatProvider";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { useQueryState } from "nuqs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { TodoItem } from "@/app/types/types";

// Task status icon component
const getStatusIcon = (status: TodoItem["status"], size: number = 14) => {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          size={size}
          className="flex-shrink-0 text-emerald-500"
        />
      );
    case "in_progress":
      return (
        <Loader2
          size={size}
          className="flex-shrink-0 text-amber-500 animate-spin"
        />
      );
    default:
      return (
        <Circle
          size={size}
          className="flex-shrink-0 text-muted-foreground/50"
        />
      );
  }
};

interface ChatInterfaceProps {
  assistant: Assistant | null;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(({ assistant }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [, setThreadId] = useQueryState("threadId");
  const [copySuccess, setCopySuccess] = useState(false);

  const [input, setInput] = useState("");
  const [threadId] = useQueryState("threadId");
  const { scrollRef, contentRef } = useStickToBottom();
  
  // Get chat context first
  const {
    stream,
    messages,
    ui,
    isLoading,
    isThreadLoading,
    interrupt,
    sendMessage,
    stopStream,
    resumeInterrupt,
    pendingInput,
    clearPendingInput,
    todos,
  } = useChatContext();
  
  // Tasks flyout state
  const [tasksExpanded, setTasksExpanded] = useState(false);
  
  // Phase names for display
  const PHASE_NAMES: Record<number, string> = {
    1: "Batch Overview",
    2: "Historical Trends", 
    3: "Content & Technical SEO",
    4: "Keyword Gap Analysis",
    5: "Competitive Benchmark",
    6: "Root Cause Investigation",
    7: "Report Generation",
  };

  // Infer currently running phase from messages (since state updates only after node completes)
  const inferredCurrentPhase = useMemo(() => {
    if (!isLoading || messages.length === 0) return null;
    
    // Find the last "started" phase status that doesn't have a corresponding "completed"
    const startedPhases = new Set<number>();
    const completedPhases = new Set<number>();
    
    for (const msg of messages) {
      const content = typeof msg.content === 'string' ? msg.content : '';
      const match = content.match(/__PHASE_STATUS__(.+?)__/);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          if (data.status === 'started') {
            startedPhases.add(data.phase);
          } else if (data.status === 'completed') {
            completedPhases.add(data.phase);
          }
        } catch {}
      }
    }
    
    // Find phases that started but not completed
    for (const phase of startedPhases) {
      if (!completedPhases.has(phase)) {
        return phase;
      }
    }
    return null;
  }, [messages, isLoading]);

  // Combine backend todos with inferred current phase
  const displayTodos = useMemo(() => {
    const result = [...todos];
    
    // If we have an inferred current phase that's not in todos, add it
    if (inferredCurrentPhase && isLoading) {
      const existingTodo = result.find(t => t.id === `phase_${inferredCurrentPhase}`);
      if (!existingTodo) {
        // Add inferred in-progress todo
        result.push({
          id: `phase_${inferredCurrentPhase}`,
          content: PHASE_NAMES[inferredCurrentPhase] || `Phase ${inferredCurrentPhase}`,
          status: 'in_progress' as const,
        });
      } else if (existingTodo.status !== 'in_progress' && existingTodo.status !== 'completed') {
        // Update to in_progress if not already
        existingTodo.status = 'in_progress';
      }
    }
    
    return result;
  }, [todos, inferredCurrentPhase, isLoading]);
  
  // 监听 pendingInput 变化，填入输入框
  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput);
      clearPendingInput();
      textareaRef.current?.focus();
    }
  }, [pendingInput, clearPendingInput]);

  const showLoadingState = isLoading;
  const submitDisabled = isLoading || !assistant;

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      const messageText = input.trim();
      if (!messageText || showLoadingState || submitDisabled) return;
      sendMessage(messageText);
      setInput("");
    },
    [input, showLoadingState, sendMessage, setInput, submitDisabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (submitDisabled) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitDisabled]
  );


  // Reset input when thread changes
  useEffect(() => {
    setInput("");
  }, [threadId]);

  // Copy chat to markdown (includes tool calls and results)
  const handleCopyChat = useCallback(async () => {
    const markdownContent = formatConversationForLLM(messages);

    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [messages]);

  const processedMessages = useMemo(() => {
    // Helper to check if content is a phase status message
    const isPhaseStatusMessage = (content: string): boolean => {
      return content.includes('__PHASE_STATUS__');
    };
    
    const messageMap = new Map<
      string,
      { message: Message; toolCalls: ToolCall[] }
    >();
    
    // First pass: identify all phase status messages and their ranges
    const phaseStatusIndices = new Map<number, { phase: number; status: string }>();
    messages.forEach((message: Message, index: number) => {
      if (message.type === "ai") {
        const content = extractStringFromMessageContent(message);
        if (isPhaseStatusMessage(content)) {
          const match = content.match(/__PHASE_STATUS__(.+?)__/);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              phaseStatusIndices.set(index, { phase: data.phase, status: data.status });
            } catch {}
          }
        }
      }
    });
    
    // Find completed phase statuses and mark started ones for hiding
    const completedPhases = new Set<number>();
    phaseStatusIndices.forEach((data) => {
      if (data.status === 'completed') {
        completedPhases.add(data.phase);
      }
    });
    
    // Build skip ranges: messages between "started" and "completed" status (for completed phases)
    const skipIndices = new Set<number>();
    const phaseStatusArray = Array.from(phaseStatusIndices.entries()).sort((a, b) => a[0] - b[0]);
    
    // For each completed phase, find its started status and hide messages in between
    completedPhases.forEach((phase) => {
      let startedIndex = -1;
      let completedIndex = -1;
      
      // Find the started and completed indices for this phase
      phaseStatusArray.forEach(([index, data]) => {
        if (data.phase === phase) {
          if (data.status === 'started') {
            startedIndex = index;
          } else if (data.status === 'completed') {
            completedIndex = index;
          }
        }
      });
      
      // If both found, hide started and TEXT-ONLY AI messages between them (keep AI messages with tool calls visible)
      if (startedIndex !== -1 && completedIndex !== -1) {
        console.log(`[ChatInterface] Hiding Phase ${phase}: started(${startedIndex}) to completed(${completedIndex})`);
        
        // Hide the "started" message itself
        skipIndices.add(startedIndex);
        
        // Hide only TEXT-ONLY AI messages between started and completed
        // Keep AI messages that have tool_calls (they need to render ToolCallBox)
        for (let j = startedIndex + 1; j < completedIndex; j++) {
          const msg = messages[j];
          if (msg.type === 'ai') {
            // Check if this AI message has tool calls
            const hasToolCalls = (
              (msg.additional_kwargs?.tool_calls && Array.isArray(msg.additional_kwargs.tool_calls) && msg.additional_kwargs.tool_calls.length > 0) ||
              (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) ||
              (Array.isArray(msg.content) && msg.content.some((block: any) => block.type === 'tool_use'))
            );
            
            if (!hasToolCalls) {
              // Only hide text-only AI messages (analysis output)
              skipIndices.add(j);
            }
            // AI messages with tool calls stay visible - they'll render ToolCallBox
          }
          // Tool messages are NOT hidden - they update the AI message's toolCalls status
        }
      }
    });
    
    console.log(`[ChatInterface] Total messages: ${messages.length}, Skipped: ${skipIndices.size}, Completed phases: [${Array.from(completedPhases).join(', ')}]`);
    
    messages.forEach((message: Message, index: number) => {
      // Skip messages that should be hidden
      if (skipIndices.has(index)) {
        return;
      }
      
      if (message.type === "ai") {
        const toolCallsInMessage: Array<{
          id?: string;
          function?: { name?: string; arguments?: unknown };
          name?: string;
          type?: string;
          args?: unknown;
          input?: unknown;
        }> = [];
        if (
          message.additional_kwargs?.tool_calls &&
          Array.isArray(message.additional_kwargs.tool_calls)
        ) {
          toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
        } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
          toolCallsInMessage.push(
            ...message.tool_calls.filter(
              (toolCall: { name?: string }) => toolCall.name !== ""
            )
          );
        } else if (Array.isArray(message.content)) {
          const toolUseBlocks = message.content.filter(
            (block: { type?: string }) => block.type === "tool_use"
          );
          toolCallsInMessage.push(...toolUseBlocks);
        }
        const toolCallsWithStatus = toolCallsInMessage.map(
          (toolCall: {
            id?: string;
            function?: { name?: string; arguments?: unknown };
            name?: string;
            type?: string;
            args?: unknown;
            input?: unknown;
          }) => {
            const name =
              toolCall.function?.name ||
              toolCall.name ||
              toolCall.type ||
              "unknown";
            const args =
              toolCall.function?.arguments ||
              toolCall.args ||
              toolCall.input ||
              {};
            return {
              id: toolCall.id || `tool-${Math.random()}`,
              name,
              args,
              status: interrupt ? "interrupted" : ("pending" as const),
            } as ToolCall;
          }
        );
        messageMap.set(message.id!, {
          message,
          toolCalls: toolCallsWithStatus,
        });
      } else if (message.type === "tool") {
        const toolCallId = message.tool_call_id;
        if (!toolCallId) {
          return;
        }
        for (const [, data] of messageMap.entries()) {
          const toolCallIndex = data.toolCalls.findIndex(
            (tc: ToolCall) => tc.id === toolCallId
          );
          if (toolCallIndex === -1) {
            continue;
          }
          data.toolCalls[toolCallIndex] = {
            ...data.toolCalls[toolCallIndex],
            status: "completed" as const,
            result: extractStringFromMessageContent(message),
          };
          break;
        }
      } else if (message.type === "human") {
        messageMap.set(message.id!, {
          message,
          toolCalls: [],
        });
      }
    });
    const processedArray = Array.from(messageMap.values());
    return processedArray.map((data, index) => {
      const prevMessage = index > 0 ? processedArray[index - 1].message : null;
      return {
        ...data,
        showAvatar: data.message.type !== prevMessage?.type,
      };
    });
  }, [messages, interrupt]);

  const actionRequestsMap: Map<string, ActionRequest> | null = useMemo(() => {
    const actionRequests =
      interrupt?.value && (interrupt.value as any)["action_requests"];
    if (!actionRequests) return new Map<string, ActionRequest>();
    return new Map(actionRequests.map((ar: ActionRequest) => [ar.name, ar]));
  }, [interrupt]);

  const reviewConfigsMap: Map<string, ReviewConfig> | null = useMemo(() => {
    const reviewConfigs =
      interrupt?.value && (interrupt.value as any)["review_configs"];
    if (!reviewConfigs) return new Map<string, ReviewConfig>();
    return new Map(
      reviewConfigs.map((rc: ReviewConfig) => [rc.actionName, rc])
    );
  }, [interrupt]);

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden p-2">
        {/* Chat container with border */}
        <div
          ref={chatContainerRef}
          className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background"
        >
          {/* Tasks flyout overlay - positioned above input area */}
          {tasksExpanded && (
            <>
              {/* Backdrop - click to close */}
              <div 
                className="absolute inset-0 z-40"
                onClick={() => setTasksExpanded(false)}
              />
              {/* Flyout panel */}
              <div className="absolute bottom-[200px] left-4 right-4 z-50 max-h-[200px] overflow-y-auto overscroll-contain rounded-lg border border-border bg-card/95 shadow-lg backdrop-blur-sm scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
                {displayTodos.length === 0 ? (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-[11px] text-muted-foreground">No tasks yet</p>
                  </div>
                ) : (
                  <div className="p-1.5 space-y-0.5">
                    {displayTodos.map((todo, index) => (
                      <div
                        key={`${todo.id}_${index}`}
                        className={cn(
                          "flex items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-muted/50",
                          todo.status === "completed" && "opacity-50"
                        )}
                      >
                        <span className="flex-shrink-0 mt-px">{getStatusIcon(todo.status, 12)}</span>
                        <span
                          className={cn(
                            "flex-1 text-[11px] leading-relaxed break-words",
                            todo.status === "completed" && "line-through text-muted-foreground"
                          )}
                        >
                          {todo.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          {/* Top border with Chat label on left and buttons on right */}
          <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4">
            {/* Left: Chat label */}
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle size={16} />
              <span>Chat</span>
            </div>

            {/* Right: Copy button */}
            <div className="flex items-center gap-1">
              {/* Copy Chat button with text */}
              <button
                type="button"
                onClick={handleCopyChat}
                disabled={messages.length === 0}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent"
                title="Copy chat as Markdown"
              >
                {copySuccess ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
                <span>Copy All</span>
              </button>
            </div>
          </div>

          {/* Resizable Chat and Input areas */}
          <ResizablePanelGroup
            direction="vertical"
            autoSaveId="chat-input-layout-v4"
            className="flex-1"
          >
            {/* Messages area */}
            <ResizablePanel
              id="messages"
              order={1}
              defaultSize={75}
              minSize={20}
              className="group/chat flex flex-col"
            >
              <div
                className="scrollbar-auto-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
                ref={scrollRef}
              >
                <div
                  className="mx-auto w-full max-w-[1024px] px-6 pb-6 pt-4"
                  ref={contentRef}
                >
                  {isThreadLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {processedMessages.map((data, index) => {
                        const messageUi = ui?.filter(
                          (u: any) => u.metadata?.message_id === data.message.id
                        );
                        const isLastMessage =
                          index === processedMessages.length - 1;
                        return (
                          <ChatMessage
                            key={data.message.id}
                            message={data.message}
                            toolCalls={data.toolCalls}
                            isLoading={isLoading}
                            actionRequestsMap={
                              isLastMessage ? actionRequestsMap : undefined
                            }
                            reviewConfigsMap={
                              isLastMessage ? reviewConfigsMap : undefined
                            }
                            ui={messageUi}
                            stream={stream}
                            onResumeInterrupt={resumeInterrupt}
                            graphId={assistant?.graph_id}
                            allMessages={messages}
                          />
                        );
                      })}
                      
                      {/* Global loading indicator when executing */}
                      {isLoading && (
                        <div className="flex items-center gap-2 py-4 text-muted-foreground animate-pulse">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Running...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Input area with Tasks bar */}
            <ResizablePanel
              id="input"
              order={2}
              defaultSize={25}
              minSize={15}
              maxSize={60}
              className="flex min-h-[160px] flex-col"
            >
              <div className="flex flex-1 flex-col bg-background px-4 pb-4 pt-2">
                {/* Tasks single-line bar */}
                {(() => {
                  const inProgressTodos = displayTodos.filter((t) => t.status === "in_progress");
                  const hasInProgress = inProgressTodos.length > 0;
                  const activeTodos = displayTodos.filter((t) => t.status !== "completed");
                  return (
                    <button
                      type="button"
                      onClick={() => setTasksExpanded(!tasksExpanded)}
                      className={cn(
                        "mb-2 flex h-8 w-full items-center justify-between rounded-lg border px-3 text-xs transition-colors hover:bg-muted/50",
                        hasInProgress 
                          ? "border-amber-300/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20" 
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {hasInProgress ? (
                          <Loader2 size={14} className="text-amber-500 animate-spin" />
                        ) : (
                          <ListTodo size={14} className="text-muted-foreground" />
                        )}
                        <span className="font-medium">Tasks</span>
                        {hasInProgress && inProgressTodos[0] && (
                          <span className="text-amber-600 dark:text-amber-400 truncate max-w-[200px]">
                            {inProgressTodos[0].content}
                          </span>
                        )}
                        {activeTodos.length > 0 && !hasInProgress && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {activeTodos.length} active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })()}

                <form
                  onSubmit={handleSubmit}
                  className={cn(
                    "flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card",
                    "transition-colors duration-200 ease-in-out"
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      showLoadingState ? "Running..." : 
                      "Write your message..."
                    }
                    className="font-inherit flex-1 resize-none border-0 bg-transparent px-[18px] py-3 text-sm leading-6 text-primary outline-none placeholder:text-gray-400"
                  />
                  <div className="flex flex-shrink-0 items-end justify-end gap-2 px-3 pb-3">
                    {/* Send button */}
                    <Button
                      type={showLoadingState ? "button" : "submit"}
                      variant={showLoadingState ? "destructive" : "default"}
                      onClick={showLoadingState ? stopStream : handleSubmit}
                      disabled={!showLoadingState && (submitDisabled || !input.trim())}
                    >
                      {showLoadingState ? (
                        <>
                          <Square size={14} />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp size={18} />
                          <span>Send</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  );
});

ChatInterface.displayName = "ChatInterface";
