"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useQueryState } from "nuqs";
import { getConfig, saveConfig, StandaloneConfig, getActiveApiKey } from "@/lib/config";
import { ConfigDialog, DEFAULT_AZURE_CONFIG } from "@/app/components/ConfigDialog";
import { Button } from "@/components/ui/button";
import { Assistant } from "@langchain/langgraph-sdk";
import { ClientProvider, useClient } from "@/providers/ClientProvider";
import { Settings } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatProvider, useChatContext } from "@/providers/ChatProvider";
import { ContextProvider } from "@/providers/ContextProvider";
import { ChatInterface } from "@/app/components/ChatInterface";
import { LeftSidebar } from "@/app/components/LeftSidebar";
import { RightSidebar } from "@/app/components/RightSidebar";
// import { ThemeToggle } from "@/app/components/ThemeToggle";
import { BackendStatus } from "@/app/components/BackendStatus";

interface HomePageInnerProps {
  config: StandaloneConfig;
  configDialogOpen: boolean;
  setConfigDialogOpen: (open: boolean) => void;
  handleSaveConfig: (config: StandaloneConfig) => void;
}

function ChatArea({ assistant }: { assistant: Assistant | null }) {
  const { files, setFiles, isLoading, interrupt } = useChatContext();

  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="main-layout"
      className="h-full"
    >
      {/* Left Sidebar - min 300px (15% of ~2000px) */}
      <ResizablePanel
        id="left-sidebar"
        order={1}
        defaultSize={20}
        minSize={15}
      >
        <LeftSidebar />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Center - Chat Area (flexible width) */}
      <ResizablePanel
        id="chat-area"
        order={2}
        defaultSize={60}
        minSize={30}
        className="flex flex-col"
      >
        <ChatInterface assistant={assistant} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Sidebar - min 300px (15% of ~2000px) */}
      <ResizablePanel
        id="right-sidebar"
        order={3}
        defaultSize={20}
        minSize={15}
      >
        <RightSidebar
          files={files}
          setFiles={setFiles}
          editDisabled={isLoading === true || interrupt !== undefined}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function HomePageInner({
  config,
  configDialogOpen,
  setConfigDialogOpen,
  handleSaveConfig,
}: HomePageInnerProps) {
  const client = useClient();

  const [mutateThreads] = useState<(() => void) | null>(null);
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  const fetchAssistant = useCallback(async () => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        config.assistantId
      );

    if (isUUID) {
      try {
        const data = await client.assistants.get(config.assistantId);
        setAssistant(data);
      } catch (error) {
        console.error("Failed to fetch assistant:", error);
        setAssistant({
          assistant_id: config.assistantId,
          graph_id: config.assistantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          config: {},
          metadata: {},
          version: 1,
          name: "Assistant",
          context: {},
        });
      }
    } else {
      try {
        const assistants = await client.assistants.search({
          graphId: config.assistantId,
          limit: 100,
        });
        const defaultAssistant = assistants.find(
          (assistant) => assistant.metadata?.["created_by"] === "system"
        );
        if (defaultAssistant === undefined) {
          throw new Error("No default assistant found");
        }
        setAssistant(defaultAssistant);
      } catch (error) {
        console.error(
          "Failed to find default assistant from graph_id: try setting the assistant_id directly:",
          error
        );
        setAssistant({
          assistant_id: config.assistantId,
          graph_id: config.assistantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          config: {},
          metadata: {},
          version: 1,
          name: config.assistantId,
          context: {},
        });
      }
    }
  }, [client, config.assistantId]);

  useEffect(() => {
    fetchAssistant();
  }, [fetchAssistant]);

  return (
    <>
      <ConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onSave={handleSaveConfig}
        initialConfig={config}
      />
      <div className="flex h-screen flex-col">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">seenos.ai-yue <span className="text-xs font-normal text-muted-foreground">v0.0.1</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <BackendStatus />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfigDialogOpen(true)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden pt-2">
          <ContextProvider>
            <ChatProvider
              activeAssistant={assistant}
              onHistoryRevalidate={() => mutateThreads?.()}
            >
              <ChatArea assistant={assistant} />
            </ChatProvider>
          </ContextProvider>
        </div>
      </div>
    </>
  );
}

function HomePageContent() {
  const [config, setConfig] = useState<StandaloneConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [assistantId, setAssistantId] = useQueryState("assistantId");

  useEffect(() => {
    const savedConfig = getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      if (!assistantId) {
        setAssistantId(savedConfig.assistantId);
      }
    } else {
      // 没有保存的配置时，使用默认配置并自动保存
      const defaultConfig: StandaloneConfig = {
        deploymentUrl: "http://127.0.0.1:2024",
        assistantId: "agent",
        activeProvider: "azure",
        selectedModel: DEFAULT_AZURE_CONFIG.model,
        openRouterConfig: {
          baseUrl: DEFAULT_AZURE_CONFIG.endpoint,
          apiKey: DEFAULT_AZURE_CONFIG.apiKey,
        },
        enabledTools: {
          fetch_url: true,
          serpapi_search: true,
          exa_search: true,
          exa_contents: true,
          exa_find_similar: true,
          exa_answer: true,
          exa_research: true,
          tavily_search: true,
          tavily_extract: true,
          tavily_map: true,
          tavily_crawl: true,
          perplexity_search: true,
          perplexity_chat: true,
        },
      };
      saveConfig(defaultConfig);
      setConfig(defaultConfig);
      setAssistantId("agent");
      
      // 同时保存到后端
      fetch("/api/backend/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "azure",
          model: DEFAULT_AZURE_CONFIG.model,
          azure_api_key: DEFAULT_AZURE_CONFIG.apiKey,
          azure_base_url: DEFAULT_AZURE_CONFIG.endpoint,
        }),
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config && !assistantId) {
      setAssistantId(config.assistantId);
    }
  }, [config, assistantId, setAssistantId]);

  const handleSaveConfig = useCallback((newConfig: StandaloneConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  // Get the active API key based on the selected provider
  const activeApiKey = getActiveApiKey(config);
  const activeProvider = config?.activeProvider || null;
  const selectedModel = activeProvider ? (config?.selectedModels?.[activeProvider] || config?.selectedModel || "") : "";

  // 等待配置加载
  if (!config) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <ClientProvider
      deploymentUrl={config.deploymentUrl}
      apiKey={activeApiKey}
      activeProvider={activeProvider}
      selectedModel={selectedModel}
    >
      <HomePageInner
        config={config}
        configDialogOpen={configDialogOpen}
        setConfigDialogOpen={setConfigDialogOpen}
        handleSaveConfig={handleSaveConfig}
      />
    </ClientProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
