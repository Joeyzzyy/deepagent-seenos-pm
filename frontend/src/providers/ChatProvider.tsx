"use client";

import { ReactNode, createContext, useContext, useState, useCallback } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { type StateType, useChat } from "@/app/hooks/useChat";
import type { UseStreamThread } from "@langchain/langgraph-sdk/react";

interface ChatProviderProps {
  children: ReactNode;
  activeAssistant: Assistant | null;
  onHistoryRevalidate?: () => void;
  thread?: UseStreamThread<StateType>;
}

export function ChatProvider({
  children,
  activeAssistant,
  onHistoryRevalidate,
  thread,
}: ChatProviderProps) {
  const chat = useChat({ activeAssistant, onHistoryRevalidate, thread });
  
  // 共享的输入框状态，允许其他组件设置输入内容
  const [pendingInput, setPendingInput] = useState<string>("");
  
  const fillInput = useCallback((text: string) => {
    setPendingInput(text);
  }, []);
  
  const clearPendingInput = useCallback(() => {
    setPendingInput("");
  }, []);
  
  return (
    <ChatContext.Provider value={{ 
      ...chat, 
      pendingInput, 
      fillInput, 
      clearPendingInput 
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export type ChatContextType = ReturnType<typeof useChat> & {
  pendingInput: string;
  fillInput: (text: string) => void;
  clearPendingInput: () => void;
};

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
