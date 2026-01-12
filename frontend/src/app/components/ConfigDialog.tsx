"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StandaloneConfig } from "@/lib/config";
import { CheckCircle, Loader2, Settings } from "lucide-react";

// 默认配置
export const DEFAULT_AZURE_CONFIG = {
  endpoint: "https://intelick-page-generation.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview",
  apiKey: "6LIp1OEWr9EW2SAqtsjoUh99UFi5t21vbqlG1vxNnMKFj8df1AEmJQQJ99BBACfhMk5XJ3w3AAABACOGKid9",
  model: "gpt-4.1",
};

// 默认后端地址
export const DEFAULT_BACKEND_URL = "http://127.0.0.1:2024";

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: StandaloneConfig) => void;
  initialConfig?: StandaloneConfig;
}

export function ConfigDialog({
  open,
  onOpenChange,
  onSave,
  initialConfig,
}: ConfigDialogProps) {
  // 后端地址配置
  const [backendUrl, setBackendUrl] = useState(
    initialConfig?.deploymentUrl || DEFAULT_BACKEND_URL
  );

  // Azure OpenAI 配置
  const [azureEndpoint, setAzureEndpoint] = useState(
    initialConfig?.openRouterConfig?.baseUrl || DEFAULT_AZURE_CONFIG.endpoint
  );
  const [azureApiKey, setAzureApiKey] = useState(
    initialConfig?.openRouterConfig?.apiKey || DEFAULT_AZURE_CONFIG.apiKey
  );
  const [azureModel, setAzureModel] = useState(
    initialConfig?.selectedModel || DEFAULT_AZURE_CONFIG.model
  );
  
  // UI 状态
  const [isKeyFocused, setIsKeyFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 同步初始配置
  useEffect(() => {
    if (open) {
      setBackendUrl(initialConfig?.deploymentUrl || DEFAULT_BACKEND_URL);
      setAzureEndpoint(initialConfig?.openRouterConfig?.baseUrl || DEFAULT_AZURE_CONFIG.endpoint);
      setAzureApiKey(initialConfig?.openRouterConfig?.apiKey || DEFAULT_AZURE_CONFIG.apiKey);
      setAzureModel(initialConfig?.selectedModel || DEFAULT_AZURE_CONFIG.model);
      setSaveSuccess(false);
    }
  }, [open, initialConfig]);

  // 保存配置到后端
  const saveToConfigServer = async (config: {
    provider: string;
    model: string;
    azure_api_key: string;
    azure_base_url: string;
  }) => {
    try {
      const response = await fetch("/api/backend/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        console.log("[CONFIG] Saved to model_config.json");
        return true;
      } else {
        const errorData = await response.json();
        console.warn("[CONFIG] Failed to save config:", errorData.error);
        return false;
      }
    } catch (error) {
      console.error("[CONFIG] Error saving config:", error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!backendUrl || !azureEndpoint || !azureApiKey || !azureModel) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    // 保存到 localStorage
    onSave({
      deploymentUrl: backendUrl,
      assistantId: "agent",
      activeProvider: "azure",
      selectedModel: azureModel,
      openRouterConfig: {
        baseUrl: azureEndpoint,
        apiKey: azureApiKey,
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
    });

    // 保存到后端配置文件
    const success = await saveToConfigServer({
      provider: "azure",
      model: azureModel,
      azure_api_key: azureApiKey,
      azure_base_url: azureEndpoint,
      });

    setIsSaving(false);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
    onOpenChange(false);
      }, 800);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure backend and Azure OpenAI API
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 后端地址配置 */}
          <div className="grid gap-2">
            <Label htmlFor="backendUrl" className="text-sm font-medium">
              Backend URL
            </Label>
            <Input
              id="backendUrl"
              placeholder="http://127.0.0.1:2024 or https://xxx.ngrok-free.app"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Local: http://127.0.0.1:2024 | Remote: your ngrok URL
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Azure OpenAI Configuration</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endpoint" className="text-sm">
              Endpoint URL
            </Label>
                      <Input
              id="endpoint"
              placeholder="https://xxx.openai.azure.com/openai/deployments/xxx/chat/completions?api-version=xxx"
              value={azureEndpoint}
              onChange={(e) => setAzureEndpoint(e.target.value)}
                      />
                    </div>

          <div className="grid gap-2">
            <Label htmlFor="apiKey" className="text-sm">
              API Key
                        </Label>
                      <Input
              id="apiKey"
              type={isKeyFocused ? "text" : "password"}
              placeholder="your-azure-api-key"
              value={azureApiKey}
              onChange={(e) => setAzureApiKey(e.target.value)}
              onFocus={() => setIsKeyFocused(true)}
              onBlur={() => setIsKeyFocused(false)}
                      />
                    </div>

          <div className="grid gap-2">
            <Label htmlFor="model" className="text-sm">
              Model Deployment Name
                        </Label>
                      <Input
              id="model"
              placeholder="gpt-4.1"
              value={azureModel}
              onChange={(e) => setAzureModel(e.target.value)}
                      />
                    </div>
                    </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !backendUrl || !azureEndpoint || !azureApiKey || !azureModel}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
