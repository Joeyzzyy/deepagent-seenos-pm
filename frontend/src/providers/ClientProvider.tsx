"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { ApiProvider } from "@/lib/config";

interface ClientContextValue {
  client: Client;
  activeProvider: ApiProvider;
  selectedModel: string;
}

const ClientContext = createContext<ClientContextValue | null>(null);

interface ClientProviderProps {
  children: ReactNode;
  deploymentUrl: string;
  apiKey: string;
  activeProvider: ApiProvider;
  selectedModel: string;
}

export function ClientProvider({
  children,
  deploymentUrl,
  apiKey,
  activeProvider,
  selectedModel,
}: ClientProviderProps) {
  const client = useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Set the appropriate header based on the active provider
    if (apiKey) {
      switch (activeProvider) {
        case "openai":
          headers["X-OpenAI-Api-Key"] = apiKey;
          break;
        case "anthropic":
          headers["X-Anthropic-Api-Key"] = apiKey;
          break;
        case "google":
          headers["X-Google-Api-Key"] = apiKey;
          break;
        case "openrouter":
          // OpenRouter uses OpenAI-compatible format
          headers["X-OpenAI-Api-Key"] = apiKey;
          break;
      }
    }
    
    // Add model header if selected
    if (selectedModel) {
      headers["X-Model-Name"] = selectedModel;
    }
    
    return new Client({
      apiUrl: deploymentUrl,
      defaultHeaders: headers,
    });
  }, [deploymentUrl, apiKey, activeProvider, selectedModel]);

  const value = useMemo(
    () => ({ client, activeProvider, selectedModel }),
    [client, activeProvider, selectedModel]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClient(): Client {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context.client;
}

export function useActiveProvider(): ApiProvider {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error("useActiveProvider must be used within a ClientProvider");
  }
  return context.activeProvider;
}

export function useSelectedModel(): string {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error("useSelectedModel must be used within a ClientProvider");
  }
  return context.selectedModel;
}
