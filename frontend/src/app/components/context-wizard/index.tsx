"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContextMenu } from "@/providers/ContextProvider";
import { OnSiteSection } from "./OnSiteSection";
import { OffSiteSection } from "./OffSiteSection";
import { KnowledgeSection } from "./KnowledgeSection";

// 导航配置
const navConfig = {
  onSite: {
    label: "On-site",
    sections: [
      { id: "brand-info", label: "Brand Info" },
      { id: "products-services", label: "Products & Services" },
      { id: "website-pages", label: "Website Pages" },
      { id: "team", label: "Team" },
    ],
  },
  offSite: {
    label: "Off-site",
    sections: [
      { id: "social-accounts", label: "Social Accounts" },
      { id: "reviews", label: "Reviews & Listings" },
      { id: "competitors", label: "Competitors" },
    ],
  },
  knowledge: {
    label: "Knowledge",
    sections: [
      { id: "knowledge-sources", label: "Knowledge Sources" },
    ],
  },
};

type TabType = "onSite" | "offSite" | "knowledge";

interface ContextWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: TabType;
}

export function ContextWizard({ open, onOpenChange, defaultTab = "onSite" }: ContextWizardProps) {
  const { contextData, updateOnSite, updateOffSite, updateKnowledge } = useContextMenu();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/30">
          <DialogTitle>Context Wizard</DialogTitle>
          <DialogDescription>
            Define your brand, products, and knowledge to power smarter agent decisions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧纵向导航 */}
          <div className="w-52 shrink-0 border-r bg-muted/20 overflow-y-auto">
            <nav className="p-3 space-y-1">
              {(Object.keys(navConfig) as TabType[]).map((tabKey) => {
                const tab = navConfig[tabKey];
                const isActive = activeTab === tabKey;
                
                return (
                  <div key={tabKey} className="mb-2">
                    <button
                      onClick={() => setActiveTab(tabKey)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all
                        ${isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-foreground hover:bg-muted"}
                      `}
                    >
                      {tab.label}
                    </button>
                    
                    {/* 子项 - 只在当前 tab 激活时显示 */}
                    {isActive && (
                      <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-muted pl-2">
                        {tab.sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className="
                              w-full text-left px-2 py-1.5 rounded text-xs 
                              text-muted-foreground hover:text-foreground hover:bg-muted/50 
                              transition-colors
                            "
                          >
                            {section.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full" ref={contentRef}>
              <div className="p-6 space-y-6">
                {activeTab === "onSite" && (
                  <OnSiteSection
                    data={contextData.onSite}
                    onUpdate={updateOnSite}
                  />
                )}
                {activeTab === "offSite" && (
                  <OffSiteSection
                    data={contextData.offSite}
                    onUpdate={updateOffSite}
                  />
                )}
                {activeTab === "knowledge" && (
                  <KnowledgeSection
                    data={contextData.knowledge}
                    onUpdate={updateKnowledge}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button onClick={() => onOpenChange(false)}>Save & Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

