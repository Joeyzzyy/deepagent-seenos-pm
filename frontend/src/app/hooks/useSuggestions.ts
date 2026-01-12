"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Message } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent, formatConversationForLLM } from "@/app/utils/utils";
import { getConfig, getActiveApiKey, ApiProvider } from "@/lib/config";

export interface Suggestion {
  short: string;
  full: string;
}

// Default suggestions when no context is available
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    short: "Research this",
    full: "Please help me conduct thorough research on this topic. I'd like you to explore multiple perspectives, gather relevant data and statistics, identify key experts and sources, and provide a comprehensive overview of the current state of knowledge in this area."
  },
  {
    short: "Summarize points",
    full: "Please summarize the key points from our conversation so far. Highlight the most important insights, decisions made, action items identified, and any outstanding questions that still need to be addressed. Organize the summary in a clear and structured format."
  },
  {
    short: "Next steps",
    full: "Based on our discussion, what are the recommended next steps I should take? Please provide a prioritized list of actions with clear explanations for each, including any dependencies, estimated effort, and potential risks or considerations I should be aware of."
  },
  {
    short: "Explain details",
    full: "Please explain this concept in more detail. Break it down into simpler components, provide relevant examples and analogies, clarify any technical terms, and help me understand both the fundamentals and the nuances of this topic."
  },
  {
    short: "Create plan",
    full: "Help me create a comprehensive plan for this project or goal. Include clear objectives, milestones, timelines, resource requirements, potential challenges and mitigation strategies, and success metrics. Structure the plan in phases if appropriate."
  },
  {
    short: "Find related",
    full: "Please help me find related information, resources, and connections to this topic. Identify relevant articles, studies, tools, communities, or experts that could provide additional insights. Explain how each resource relates to my current needs."
  },
  {
    short: "Compare options",
    full: "Please compare the different options or approaches we've discussed. Create a structured comparison covering pros and cons, costs and benefits, risks and opportunities, and provide a recommendation based on the specific criteria and constraints of my situation."
  },
  {
    short: "Generate ideas",
    full: "Help me brainstorm and generate creative ideas for this challenge. Think outside the box, consider unconventional approaches, draw inspiration from different domains, and provide a diverse range of options from practical to innovative solutions."
  },
  {
    short: "Review improve",
    full: "Please review what we have so far and suggest improvements. Identify areas that could be strengthened, point out any gaps or inconsistencies, recommend specific enhancements, and help me elevate the quality and effectiveness of this work."
  },
  {
    short: "Key questions",
    full: "What are the most important questions I should be asking about this topic or situation? Help me identify blind spots, critical considerations I might have missed, and the key inquiries that will lead to better understanding and decision-making."
  },
  {
    short: "Identify issues",
    full: "Please help me identify potential issues, risks, or problems that could arise. Consider technical, practical, and strategic perspectives. For each issue identified, suggest possible mitigation strategies or preventive measures I could implement."
  },
  {
    short: "Best practices",
    full: "What are the industry best practices and proven approaches for this type of situation? Share relevant frameworks, methodologies, and lessons learned from successful implementations. Help me understand what separates good execution from great execution."
  },
  {
    short: "Simplify this",
    full: "Please help me simplify this concept or process. Break it down into its most essential components, remove unnecessary complexity, and present it in a way that is easier to understand and implement. Focus on clarity and accessibility."
  },
  {
    short: "Provide examples",
    full: "Please provide concrete examples that illustrate this concept or approach. Include real-world scenarios, case studies, or practical demonstrations that help me understand how this applies in different contexts and situations."
  },
  {
    short: "Analyze deeper",
    full: "Help me analyze this topic more deeply. Look beyond the surface level, examine underlying patterns and relationships, consider different angles and perspectives, and provide insights that reveal the deeper significance and implications."
  },
  {
    short: "Create checklist",
    full: "Please create a comprehensive checklist for this task or project. Include all the essential steps, important considerations, quality checks, and verification points that I should address to ensure thorough and successful completion."
  },
  {
    short: "Suggest tools",
    full: "What tools, technologies, or resources would you recommend for this task? Please provide specific suggestions with brief explanations of why each tool is suitable, including any alternatives and considerations for different use cases."
  },
  {
    short: "Estimate effort",
    full: "Help me estimate the time, resources, and effort required for this task or project. Consider different scenarios, identify factors that could affect the timeline, and provide realistic expectations along with any assumptions made."
  },
  {
    short: "Explore alternatives",
    full: "Please explore alternative approaches or solutions to this problem. Present different options I might not have considered, compare their trade-offs, and help me understand which alternatives might work best under different circumstances."
  },
  {
    short: "Validate approach",
    full: "Please help me validate this approach or solution. Review the logic and assumptions, identify potential weaknesses or blind spots, suggest improvements, and confirm whether this is a sound and viable path forward."
  },
];

// LocalStorage key for suggestions cache
const SUGGESTIONS_CACHE_KEY = "deep-agent-suggestions-cache";

// Helper to get cached suggestions from localStorage
function getCachedSuggestions(cacheKey: string): Suggestion[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(SUGGESTIONS_CACHE_KEY);
    if (!cached) return null;
    const cacheMap = JSON.parse(cached) as Record<string, Suggestion[]>;
    return cacheMap[cacheKey] || null;
  } catch {
    return null;
  }
}

// Helper to save suggestions to localStorage cache
function saveSuggestionsToCache(cacheKey: string, suggestions: Suggestion[]): void {
  if (typeof window === "undefined") return;
  try {
    const cached = localStorage.getItem(SUGGESTIONS_CACHE_KEY);
    const cacheMap: Record<string, Suggestion[]> = cached ? JSON.parse(cached) : {};
    cacheMap[cacheKey] = suggestions;
    
    // Limit cache size to prevent localStorage from growing too large (keep last 50 entries)
    const keys = Object.keys(cacheMap);
    if (keys.length > 50) {
      const keysToRemove = keys.slice(0, keys.length - 50);
      keysToRemove.forEach(key => delete cacheMap[key]);
    }
    
    localStorage.setItem(SUGGESTIONS_CACHE_KEY, JSON.stringify(cacheMap));
  } catch (error) {
    console.warn("Failed to save suggestions to cache:", error);
  }
}

interface UseSuggestionsProps {
  threadId: string | null;
  messages: Message[];
  isLoading: boolean;
  /** Suggestions from agent response (from SuggestionsMiddleware) */
  agentSuggestions?: Suggestion[];
}

// System prompt for generating suggestions
const SUGGESTION_SYSTEM_PROMPT = `You are a helpful assistant that generates follow-up question suggestions based on a conversation context.

Given the conversation history, generate exactly 20 contextually relevant follow-up prompts that the user might want to ask next.

For each suggestion, provide:
1. "short": A very brief label (2-4 words max) that summarizes the prompt
2. "full": A detailed, complete prompt (MUST be at least 20 words, ideally 25-40 words) that the user can use directly

IMPORTANT: Each "full" prompt MUST contain at least 20 words. Make them specific, detailed, and actionable.

The suggestions should:
- Be directly relevant to the conversation context
- Cover different aspects and directions the conversation could go
- Be specific and actionable, not generic
- Help the user explore the topic deeper or take next steps

Respond ONLY with a valid JSON array of objects, no other text:
[{"short": "brief label", "full": "detailed prompt with at least 20 words..."}, ...]`;

export function useSuggestions({
  threadId,
  messages,
  isLoading,
  agentSuggestions,
}: UseSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(DEFAULT_SUGGESTIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevIsLoadingRef = useRef(isLoading);
  const lastMessageIdRef = useRef<string | null>(null);
  const prevAgentSuggestionsRef = useRef<Suggestion[] | undefined>(undefined);

  // Use agent suggestions if available (from SuggestionsMiddleware)
  useEffect(() => {
    if (agentSuggestions && agentSuggestions.length > 0) {
      // Only update if agent suggestions actually changed
      if (JSON.stringify(agentSuggestions) !== JSON.stringify(prevAgentSuggestionsRef.current)) {
        console.log("Using suggestions from agent response:", agentSuggestions.length);
        setSuggestions(agentSuggestions);
        prevAgentSuggestionsRef.current = agentSuggestions;
        
        // Also cache them for future use
        const cacheKey = threadId || "new";
        const lastAIMessage = messages.find((m, i) => 
          i === messages.length - 1 || messages.slice(i + 1).every(msg => msg.type !== "ai")
        );
        if (lastAIMessage?.id) {
          saveSuggestionsToCache(`${cacheKey}_${lastAIMessage.id}`, agentSuggestions);
        }
      }
    }
  }, [agentSuggestions, threadId, messages]);

  // Get the last AI message content for context
  const getLastAIMessageContext = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "ai") {
        return {
          id: messages[i].id,
          content: extractStringFromMessageContent(messages[i]),
        };
      }
    }
    return null;
  }, [messages]);

  // Generate suggestions using direct OpenAI-compatible API call
  const generateSuggestionsWithLLM = useCallback(async (conversationContext: string): Promise<Suggestion[]> => {
    // Get config dynamically to ensure we have the latest values
    const config = getConfig();
    const activeProvider = config?.activeProvider || null;

    // Get API key and base URL based on provider
    let apiKey: string | null = null;
    let baseUrl: string = "https://api.openai.com/v1";

    if (activeProvider === "openai" && config?.openaiApiKey) {
      apiKey = config.openaiApiKey;
      baseUrl = "https://api.openai.com/v1";
    } else if (activeProvider === "anthropic" && config?.anthropicApiKey) {
      // Anthropic uses a different API format, fall back to defaults for now
      console.log("[SUGGESTIONS] Anthropic not supported for direct API, using defaults");
      return DEFAULT_SUGGESTIONS;
    } else if (activeProvider === "google" && config?.googleApiKey) {
      // Google uses a different API format, fall back to defaults for now
      console.log("[SUGGESTIONS] Google not supported for direct API, using defaults");
      return DEFAULT_SUGGESTIONS;
    } else if (activeProvider === "openrouter" && config?.openRouterConfig?.apiKey) {
      apiKey = config.openRouterConfig.apiKey;
      baseUrl = config.openRouterConfig.baseUrl || "https://openrouter.ai/api/v1";
    }

    if (!apiKey) {
      console.warn("[SUGGESTIONS] No API key available, using defaults");
      return DEFAULT_SUGGESTIONS;
    }

    // Determine the model to use
    // Get provider key (for openrouter, include sub-provider)
    let providerKey = activeProvider || "";
    if (activeProvider === "openrouter" && config?.openRouterConfig?.baseUrl) {
      // Try to match the baseUrl to a preset to get the sub-provider name
      const presets = [
        { name: "OpenRouter", url: "https://openrouter.ai/api/v1" },
        { name: "DeerAPI", url: "https://api.deerapi.com/v1" },
        { name: "ZenMux", url: "https://zenmux.ai/api/v1" },
        { name: "Together AI", url: "https://api.together.xyz/v1" },
        { name: "Groq", url: "https://api.groq.com/openai/v1" },
        { name: "Fireworks", url: "https://api.fireworks.ai/inference/v1" },
        { name: "Ollama (Local)", url: "http://localhost:11434/v1" },
      ];
      const match = presets.find(p => p.url === config.openRouterConfig?.baseUrl);
      providerKey = `openrouter:${match ? match.name : "Custom"}`;
    }
    
    // Read from per-provider model overrides
    const providerOverrides = config?.modelOverridesByProvider?.[providerKey] || config?.modelOverrides || {};
    const suggestionsModel = providerOverrides.suggestions;
    
    const primaryModel = activeProvider && config?.selectedModels 
      ? config.selectedModels[providerKey] || config.selectedModels[activeProvider]
      : config?.selectedModel;
    const effectiveModel = suggestionsModel || primaryModel || "gpt-4o-mini";

    console.log("[MODEL CONFIG] Suggestions generation (direct API):", {
      suggestionsModelOverride: suggestionsModel || "(inherit from primary)",
      primaryModel: primaryModel || "(not set)",
      effectiveModel,
      provider: activeProvider,
      baseUrl,
    });

    try {
      // Prepare the prompt
      const userPrompt = `Based on this conversation, generate 20 contextually relevant follow-up prompts:

---
${conversationContext.slice(0, 3000)}
---

CRITICAL: Each "full" prompt MUST have at least 20 words. Make them detailed and specific to the conversation context.
Return ONLY a valid JSON array with "short" (2-4 words) and "full" (at least 20 words) for each suggestion.`;

      // Direct call to OpenAI-compatible API
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: [
            { role: "system", content: SUGGESTION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SUGGESTIONS] API error:", response.status, errorText);
        return DEFAULT_SUGGESTIONS;
      }

      const data = await response.json();
      const fullResponse = data.choices?.[0]?.message?.content || "";

      // Try to parse the JSON response
      if (fullResponse) {
        // Extract JSON from the response (handle markdown code blocks)
        let jsonStr = fullResponse;
        const jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        } else {
          // Try to find JSON array directly
          const arrayMatch = fullResponse.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonStr = arrayMatch[0];
          }
        }

        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate and clean up suggestions
            const validSuggestions = parsed
              .filter((s: unknown) => 
                s && typeof s === 'object' && 
                'short' in s && 'full' in s &&
                typeof (s as Suggestion).short === 'string' && 
                typeof (s as Suggestion).full === 'string' &&
                // Ensure full prompt has at least 20 words
                (s as Suggestion).full.split(/\s+/).length >= 15 // Allow some tolerance
              )
              .slice(0, 20)
              .map((s: Suggestion) => ({
                short: s.short.slice(0, 30), // Limit short to 30 chars
                full: s.full,
              }));
            
            if (validSuggestions.length >= 3) {
              console.log("[SUGGESTIONS] Generated", validSuggestions.length, "suggestions");
              return validSuggestions;
            }
          }
        } catch (parseError) {
          console.warn("[SUGGESTIONS] Failed to parse response:", parseError);
        }
      }
    } catch (error) {
      console.warn("[SUGGESTIONS] Error generating:", error);
    }

    // Fallback to defaults
    return DEFAULT_SUGGESTIONS;
  }, []);

  // Check cache and load suggestions
  const loadSuggestions = useCallback(async () => {
    const cacheKey = threadId || "new";
    const lastAIMessage = getLastAIMessageContext();

    // If no messages, use defaults
    if (!lastAIMessage || messages.length === 0) {
      setSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }

    // Check if we already have cached suggestions for this message (localStorage)
    const cachedKey = `${cacheKey}_${lastAIMessage.id}`;
    const cachedSuggestions = getCachedSuggestions(cachedKey);
    if (cachedSuggestions) {
      console.log("Using cached suggestions for:", cachedKey);
      setSuggestions(cachedSuggestions);
      return;
    }

    // Generate new suggestions using LLM
    console.log("Generating new suggestions for:", cachedKey);
    setIsRefreshing(true);
    try {
      // Get full conversation context
      const conversationContext = formatConversationForLLM(messages);
      const newSuggestions = await generateSuggestionsWithLLM(conversationContext);
      
      // Save to localStorage cache
      saveSuggestionsToCache(cachedKey, newSuggestions);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      setSuggestions(DEFAULT_SUGGESTIONS);
    } finally {
      setIsRefreshing(false);
    }
  }, [threadId, messages, getLastAIMessageContext, generateSuggestionsWithLLM]);

  // Watch for loading state changes (agent finished responding)
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    // Detect when loading transitions from true to false (agent finished)
    if (wasLoading && !isLoading && messages.length > 0) {
      const lastAIMessage = getLastAIMessageContext();
      
      // Only refresh if the last AI message changed AND not already cached
      if (lastAIMessage && lastAIMessage.id !== lastMessageIdRef.current) {
        const cacheKey = threadId || "new";
        const cachedKey = `${cacheKey}_${lastAIMessage.id}`;
        
        // Check cache first before triggering load
        const cachedSuggestions = getCachedSuggestions(cachedKey);
        if (cachedSuggestions) {
          console.log("Agent finished, using cached suggestions");
          setSuggestions(cachedSuggestions);
          lastMessageIdRef.current = lastAIMessage.id || null;
        } else {
          lastMessageIdRef.current = lastAIMessage.id || null;
          loadSuggestions();
        }
      }
    }
  }, [isLoading, messages.length, threadId, getLastAIMessageContext, loadSuggestions]);

  // Load cached suggestions when thread changes or messages are loaded
  useEffect(() => {
    const cacheKey = threadId || "new";
    const lastAIMessage = getLastAIMessageContext();
    
    if (lastAIMessage) {
      const cachedKey = `${cacheKey}_${lastAIMessage.id}`;
      
      // Check localStorage cache first
      const cachedSuggestions = getCachedSuggestions(cachedKey);
      if (cachedSuggestions) {
        console.log("Thread loaded, using cached suggestions");
        setSuggestions(cachedSuggestions);
        lastMessageIdRef.current = lastAIMessage.id || null;
        return;
      }
      
      // If not cached and we have messages, generate suggestions
      if (lastAIMessage.id !== lastMessageIdRef.current && !isLoading) {
        lastMessageIdRef.current = lastAIMessage.id || null;
        loadSuggestions();
        return;
      }
    }
    
    // Reset to defaults for new threads with no messages
    if (messages.length === 0) {
      setSuggestions(DEFAULT_SUGGESTIONS);
      lastMessageIdRef.current = null;
    }
  }, [threadId, messages.length, getLastAIMessageContext, isLoading, loadSuggestions]);

  return {
    suggestions,
    isRefreshing,
    refreshSuggestions: loadSuggestions,
  };
}
