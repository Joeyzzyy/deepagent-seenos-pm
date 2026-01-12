"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ContextData, initialContextData, OnSiteContext, OffSiteContext, KnowledgeContext } from "@/app/types/context";

interface ContextContextType {
  contextData: ContextData;
  updateOnSite: (data: Partial<OnSiteContext>) => void;
  updateOffSite: (data: Partial<OffSiteContext>) => void;
  updateKnowledge: (data: Partial<KnowledgeContext>) => void;
  setContextData: (data: ContextData) => void;
  isContextEmpty: boolean;
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
}

const ContextContext = createContext<ContextContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const [contextData, setContextDataState] = useState<ContextData>(initialContextData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedContext = localStorage.getItem("deep-agents-context");
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        // Ensure structure matches current types (merge with initial)
        setContextDataState({
          ...initialContextData,
          ...parsed,
          onSite: { ...initialContextData.onSite, ...(parsed.onSite || {}) },
          offSite: { ...initialContextData.offSite, ...(parsed.offSite || {}) },
          knowledge: { ...initialContextData.knowledge, ...(parsed.knowledge || {}) },
        });
      } catch (e) {
        console.error("Failed to parse context data from localStorage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("deep-agents-context", JSON.stringify(contextData));
    }
  }, [contextData, isLoaded]);

  const updateOnSite = (data: Partial<OnSiteContext>) => {
    setContextDataState((prev) => ({
      ...prev,
      onSite: { ...prev.onSite, ...data },
      metadata: { ...prev.metadata, lastUpdated: new Date().toISOString() },
    }));
  };

  const updateOffSite = (data: Partial<OffSiteContext>) => {
    setContextDataState((prev) => ({
      ...prev,
      offSite: { ...prev.offSite, ...data },
      metadata: { ...prev.metadata, lastUpdated: new Date().toISOString() },
    }));
  };

  const updateKnowledge = (data: Partial<KnowledgeContext>) => {
    setContextDataState((prev) => ({
      ...prev,
      knowledge: { ...prev.knowledge, ...data },
      metadata: { ...prev.metadata, lastUpdated: new Date().toISOString() },
    }));
  };

  const setContextData = (data: ContextData) => {
    setContextDataState(data);
  };

  // Check if context is effectively empty
  const isContextEmpty = React.useMemo(() => {
    const { onSite, offSite, knowledge } = contextData;

    const hasOnSite =
      !!onSite.brandInfo.name ||
      onSite.landingPages.length > 0 ||
      onSite.blogPosts.length > 0;

    const hasOffSite =
      offSite.officialAccounts.length > 0 ||
      offSite.pressReleases.length > 0;

    const hasKnowledge =
      knowledge.competitors.length > 0 ||
      knowledge.userUploads.length > 0;

    return !hasOnSite && !hasOffSite && !hasKnowledge;
  }, [contextData]);

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ContextContext.Provider
      value={{
        contextData,
        updateOnSite,
        updateOffSite,
        updateKnowledge,
        setContextData,
        isContextEmpty,
        wizardOpen,
        setWizardOpen,
      }}
    >
      {children}
    </ContextContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextContext);
  if (context === undefined) {
    throw new Error("useContextMenu must be used within a ContextProvider");
  }
  return context;
}




