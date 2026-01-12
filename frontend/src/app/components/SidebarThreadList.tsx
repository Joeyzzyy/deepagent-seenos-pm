"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, MessageSquare, Trash2, Plus } from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ThreadItem } from "@/app/hooks/useThreads";
import { useThreads, deleteThread } from "@/app/hooks/useThreads";

const GROUP_LABELS = {
  interrupted: "Requiring Attention",
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  older: "Older",
} as const;

const STATUS_COLORS: Record<ThreadItem["status"], string> = {
  idle: "bg-green-500",
  busy: "bg-blue-500",
  interrupted: "bg-orange-500",
  error: "bg-red-600",
};

function getThreadColor(status: ThreadItem["status"]): string {
  return STATUS_COLORS[status] ?? "bg-gray-400";
}

function formatTime(date: Date, now = new Date()): string {
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return format(date, "HH:mm");
  if (days === 1) return "Yesterday";
  if (days < 7) return format(date, "EEEE");
  return format(date, "MM/dd");
}

function LoadingState() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground/30" />
      <p className="text-xs text-muted-foreground">No chats yet</p>
    </div>
  );
}

interface SidebarThreadListProps {
  onThreadSelect?: (id: string) => void;
  onInterruptCountChange?: (count: number) => void;
}

export function SidebarThreadList({
  onThreadSelect,
  onInterruptCountChange,
}: SidebarThreadListProps) {
  const [currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const threads = useThreads({
    limit: 20,
  });

  const handleThreadClick = useCallback(
    async (threadId: string) => {
      await setCurrentThreadId(threadId);
      onThreadSelect?.(threadId);
    },
    [setCurrentThreadId, onThreadSelect]
  );

  const handleNewChat = useCallback(async () => {
    await setCurrentThreadId(null);
  }, [setCurrentThreadId]);

  const handleDeleteClick = useCallback(
    (threadId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setThreadToDelete(threadId);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!threadToDelete) return;

    setDeletingThreadId(threadToDelete);

    try {
      await deleteThread(threadToDelete);

      if (currentThreadId === threadToDelete) {
        setCurrentThreadId(null);
      }

      threads.mutate();
    } catch (error) {
      console.error("Failed to delete thread:", error);
    } finally {
      setDeletingThreadId(null);
      setThreadToDelete(null);
    }
  }, [threadToDelete, currentThreadId, setCurrentThreadId, threads]);

  const flattened = useMemo(() => {
    return threads.data?.flat() ?? [];
  }, [threads.data]);

  const isLoadingMore =
    threads.size > 0 && threads.data?.[threads.size - 1] == null;
  const isEmpty = threads.data?.at(0)?.length === 0;
  const isReachingEnd = isEmpty || (threads.data?.at(-1)?.length ?? 0) < 20;

  // Group threads by time and status
  const grouped = useMemo(() => {
    const now = new Date();
    const groups: Record<keyof typeof GROUP_LABELS, ThreadItem[]> = {
      interrupted: [],
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    flattened.forEach((thread) => {
      if (thread.status === "interrupted") {
        groups.interrupted.push(thread);
        return;
      }

      const diff = now.getTime() - thread.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        groups.today.push(thread);
      } else if (days === 1) {
        groups.yesterday.push(thread);
      } else if (days < 7) {
        groups.week.push(thread);
      } else {
        groups.older.push(thread);
      }
    });

    return groups;
  }, [flattened]);

  const interruptedCount = useMemo(() => {
    return flattened.filter((t) => t.status === "interrupted").length;
  }, [flattened]);

  // Notify parent of interrupt count changes
  useEffect(() => {
    onInterruptCountChange?.(interruptedCount);
  }, [interruptedCount, onInterruptCountChange]);

  return (
    <div className="flex h-full flex-col">
      {/* New Chat Button */}
      <div className="flex-shrink-0 px-3 py-2">
        <Button
          onClick={handleNewChat}
          className="w-full gap-2 bg-[#2F6868] text-white hover:bg-[#2F6868]/80"
          size="sm"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        {threads.error && (
          <div className="p-4 text-center text-xs text-red-500">
            Failed to load chats
          </div>
        )}

        {!threads.error && !threads.data && threads.isLoading && (
          <LoadingState />
        )}

        {!threads.error && !threads.isLoading && isEmpty && <EmptyState />}

        {!threads.error && !isEmpty && (
          <div className="px-2 pb-2">
            {(
              Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>
            ).map((group) => {
              const groupThreads = grouped[group];
              if (groupThreads.length === 0) return null;

              return (
                <div key={group} className="mb-3">
                  <h4 className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {GROUP_LABELS[group]}
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    {groupThreads.map((thread) => (
                      <div key={thread.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => handleThreadClick(thread.id)}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors",
                            "hover:bg-accent",
                            currentThreadId === thread.id
                              ? "bg-accent/80"
                              : "bg-transparent"
                          )}
                          aria-current={currentThreadId === thread.id}
                        >
                          {/* Status indicator */}
                          <div
                            className={cn(
                              "mt-1.5 h-2 w-2 flex-shrink-0 rounded-full",
                              getThreadColor(thread.status)
                            )}
                          />

                          {/* Title and time */}
                          <div className="min-w-0 flex-1 pr-6 overflow-hidden">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-sm font-medium leading-tight line-clamp-2 break-words">
                                {thread.title}
                              </span>
                              <span className="flex-shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatTime(thread.updatedAt)}
                              </span>
                            </div>
                            {thread.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {thread.description}
                              </p>
                            )}
                          </div>
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(thread.id, e)}
                          disabled={deletingThreadId === thread.id}
                          className={cn(
                            "absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity",
                            "hover:bg-destructive hover:text-destructive-foreground",
                            "group-hover:opacity-100",
                            "disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                          aria-label="Delete chat"
                        >
                          {deletingThreadId === thread.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {!isReachingEnd && (
              <div className="flex justify-center py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => threads.setSize(threads.size + 1)}
                  disabled={isLoadingMore}
                  className="h-7 text-xs"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete chat"
        description="Are you sure you want to delete this chat? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
        variant="destructive"
        loading={deletingThreadId !== null}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

