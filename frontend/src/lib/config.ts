export type ApiProvider = "openai" | "anthropic" | "google" | "openrouter" | "azure" | null;

// Model override configuration for subagents, internal functions, and tools
export interface ModelOverrides {
  // Subagent model configuration
  subagents?: {
    'general-purpose'?: string | null; // null = inherit from main agent
    // Reserved for custom subagent configurations
    [key: string]: string | null | undefined;
  };
  // Internal function model configuration
  summarization?: string | null; // null = inherit from main agent
  suggestions?: string | null; // null = inherit from main agent (for follow-up suggestions)
  // Tool model configuration (reserved, tools don't need models currently)
  tools?: {
    [toolName: string]: string | null | undefined;
  };
}

// Model overrides stored per provider
export type ModelOverridesByProvider = {
  [provider: string]: ModelOverrides;
};

// OpenRouter configuration (also works for other OpenAI-compatible APIs)
export interface OpenRouterConfig {
  baseUrl: string;
  apiKey: string;
}

// Tool enable/disable configuration
export interface EnabledTools {
  // Built-in tools (always enabled: write_todos, task)
  fetch_url?: boolean;
  // SerpAPI tools (require API key)
  serpapi_search?: boolean;
  // Exa tools (require API key)
  exa_search?: boolean;
  exa_contents?: boolean;
  exa_find_similar?: boolean;
  exa_answer?: boolean;
  exa_research?: boolean;
  // Tavily tools (require API key)
  tavily_search?: boolean;
  tavily_extract?: boolean;
  tavily_map?: boolean;
  tavily_crawl?: boolean;
  // Perplexity tools (require API key)
  perplexity_search?: boolean;
  perplexity_chat?: boolean;
}

export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  // SerpAPI for Google search
  serpApiKey?: string;
  // Exa API for neural search
  exaApiKey?: string;
  // Tavily API for web search
  tavilyApiKey?: string;
  // Perplexity API for AI-powered search
  perplexityApiKey?: string;
  // OpenRouter / Custom OpenAI-compatible API
  openRouterConfig?: OpenRouterConfig;
  // Store API keys for each OpenAI Compatible provider separately
  openAICompatibleApiKeys?: Record<string, string>;
  activeProvider?: ApiProvider;
  selectedModel?: string;
  // Store selected model for each provider
  // For OpenAI Compatible (openrouter), keys can be "openrouter:DeerAPI", "openrouter:ZenMux", etc.
  selectedModels?: Record<string, string>;
  // Advanced model overrides configuration (legacy, global)
  modelOverrides?: ModelOverrides;
  // Model overrides stored per provider (new, preferred)
  modelOverridesByProvider?: ModelOverridesByProvider;
  // Tool enable/disable configuration
  enabledTools?: EnabledTools;
}

// Function to fetch OpenAI models
export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    const data = await response.json();
    // Filter to only show chat models (gpt-*)
    const models = data.data
      .map((m: { id: string }) => m.id)
      .filter((id: string) => id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3"))
      .sort();
    return models;
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    throw error;
  }
}

// Function to fetch Anthropic models
export async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    const data = await response.json();
    // Extract model IDs
    const models = data.data
      .map((m: { id: string }) => m.id)
      .sort();
    return models;
  } catch (error) {
    console.error("Failed to fetch Anthropic models:", error);
    throw error;
  }
}

// Function to fetch Google Gemini models
export async function fetchGoogleModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    const data = await response.json();
    // Extract model names and filter for gemini models
    const models = data.models
      .map((m: { name: string }) => m.name.replace("models/", ""))
      .filter((name: string) => name.includes("gemini"))
      .sort();
    return models;
  } catch (error) {
    console.error("Failed to fetch Google models:", error);
    throw error;
  }
}

// Function to validate OpenRouter / OpenAI-compatible API configuration
// Uses a server-side proxy to avoid CORS issues
export async function validateOpenRouter(config: OpenRouterConfig): Promise<{ valid: boolean; models: string[]; error?: string }> {
  if (!config.baseUrl || !config.apiKey) {
    return { valid: false, models: [], error: "Base URL and API Key are required" };
  }

  try {
    // Use the proxy API route to bypass CORS restrictions
    const response = await fetch("/api/proxy/models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || `API error: ${response.status}`);
    }

    return { valid: true, models: data.models || [] };
  } catch (error) {
    console.error("Failed to validate OpenRouter:", error);
    return {
      valid: false,
      models: [],
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

// Function to validate API key and get models
export async function validateAndFetchModels(
  provider: ApiProvider,
  apiKey: string,
  _azureConfig?: unknown,
  _bedrockConfig?: unknown,
  openRouterConfig?: OpenRouterConfig
): Promise<{ valid: boolean; models: string[]; error?: string }> {
  try {
    switch (provider) {
      case "openai":
        if (!apiKey) {
          return { valid: false, models: [], error: "API key is required" };
        }
        const openaiModels = await fetchOpenAIModels(apiKey);
        return { valid: true, models: openaiModels };
      
      case "anthropic":
        if (!apiKey) {
          return { valid: false, models: [], error: "API key is required" };
        }
        const anthropicModels = await fetchAnthropicModels(apiKey);
        return { valid: true, models: anthropicModels };
      
      case "google":
        if (!apiKey) {
          return { valid: false, models: [], error: "API key is required" };
        }
        const googleModels = await fetchGoogleModels(apiKey);
        return { valid: true, models: googleModels };
      
      case "openrouter":
        if (!openRouterConfig) {
          return { valid: false, models: [], error: "OpenRouter configuration is required" };
        }
        return await validateOpenRouter(openRouterConfig);
      
      default:
        return { valid: false, models: [], error: "Unknown provider" };
    }
  } catch (error) {
    return { 
      valid: false, 
      models: [], 
      error: error instanceof Error ? error.message : "Validation failed" 
    };
  }
}

const CONFIG_KEY = "deep-agent-config";

export function getConfig(): StandaloneConfig | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveConfig(config: StandaloneConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getActiveApiKey(config: StandaloneConfig | null): string {
  if (!config || !config.activeProvider) return "";
  
  switch (config.activeProvider) {
    case "openai":
      return config.openaiApiKey || "";
    case "anthropic":
      return config.anthropicApiKey || "";
    case "google":
      return config.googleApiKey || "";
    case "openrouter":
    case "azure":
      return config.openRouterConfig?.apiKey || "";
    default:
      return "";
  }
}

export function getAuthScheme(provider: ApiProvider): string {
  switch (provider) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "google":
      return "google";
    case "openrouter":
    case "azure":
      // OpenRouter and Azure use OpenAI-compatible format
      return "openai";
    default:
      return "openai";
  }
}
