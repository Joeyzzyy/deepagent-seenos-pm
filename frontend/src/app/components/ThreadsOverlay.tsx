"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ThreadList } from "@/app/components/ThreadList";

interface ThreadsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (id: string) => void;
  onInterruptCountChange: (count: number) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  chatContainerHeight: number;
}

export const ThreadsOverlay = React.memo<ThreadsOverlayProps>(
  ({
    isOpen,
    onClose,
    onThreadSelect,
    onInterruptCountChange,
    anchorRef,
    chatContainerHeight,
  }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Calculate position based on anchor element
    useEffect(() => {
      if (isOpen && anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8, // 8px gap below button
          left: rect.right - 380, // Align right edge with button
        });
      }
    }, [isOpen, anchorRef]);

    const handleThreadSelectAndClose = useCallback(
      (id: string) => {
        onThreadSelect(id);
        onClose();
      },
      [onThreadSelect, onClose]
    );

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Overlay Panel - ThreadList has its own header with close button */}
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          style={{
            top: position.top,
            left: Math.max(16, position.left), // Ensure minimum 16px from left edge
            width: 380,
            height: Math.min(chatContainerHeight - 16, 600), // Max 600px or chat area height
            maxHeight: "calc(100vh - 100px)",
          }}
        >
          {/* ThreadList includes its own header with title, filter, and close button */}
          <div className="relative flex-1 overflow-hidden">
            <ThreadList
              onThreadSelect={handleThreadSelectAndClose}
              onInterruptCountChange={onInterruptCountChange}
              onClose={onClose}
            />
          </div>
        </div>
      </>
    );
  }
);

ThreadsOverlay.displayName = "ThreadsOverlay";
