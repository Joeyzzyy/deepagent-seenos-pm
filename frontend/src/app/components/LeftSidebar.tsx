"use client";

import React, { useState, useCallback } from "react";
import {
  Database,
  Plus,
  Globe,
  Share2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  Users,
  Megaphone,
  Briefcase,
  TrendingUp,
  File,
  User,
  Layout,
  Palette,
  Network,
  ShoppingBag,
  MessageSquare,
  Newspaper,
  Target,
  Paintbrush,
  Book,
  Flag,
  AlertCircle,
  Zap,
  Building,
  Star,
  Info,
  HelpCircle,
  MapPin,
  Mail,
  Phone,
  LayoutList,
  Type,
  Folder,
  Upload,
  Cloud,
  Save,
  MessagesSquare,
  CheckCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useContextMenu } from "@/providers/ContextProvider";
import { ContextWizard } from "@/app/components/context-wizard";
import { SidebarThreadList } from "@/app/components/SidebarThreadList";

interface LeftSidebarProps {
  onAddContext?: () => void;
  onThreadSelect?: (threadId: string) => void;
  onInterruptCountChange?: (count: number) => void;
}

// Tree Item Component
const TreeItem = ({
  label,
  count,
  icon: Icon,
  children,
  level = 0,
  defaultExpanded = false,
  onClick
}: {
  label: string,
  count?: number,
  icon: any,
  children?: React.ReactNode,
  level?: number,
  defaultExpanded?: boolean,
  onClick?: () => void
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = !!children;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent opening context wizard when toggling
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation
    if (onClick) {
      onClick();
    } else if (hasChildren) {
      // If no specific click action, toggle expand
      setExpanded(!expanded);
    }
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center justify-between p-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors group text-sm",
          level > 0 && "ml-3"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {hasChildren ? (
            <div
              role="button"
              className="text-muted-foreground/50 group-hover:text-muted-foreground p-0.5 hover:bg-accent rounded"
              onClick={handleToggle}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : (
            <div className="w-[18px]" /> // Spacer
          )}

          <Icon size={14} className={cn(
            level === 0 ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "truncate",
            level === 0 ? "font-medium" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {label}
          </span>
        </div>

        {count !== undefined && (
          <span className="text-xs text-muted-foreground/60 tabular-nums px-1">
            {count}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-border/50 ml-[11px]">
          {children}
        </div>
      )}
    </div>
  );
};

export const LeftSidebar = React.memo<LeftSidebarProps>(
  ({ onAddContext, onThreadSelect, onInterruptCountChange }) => {
    const { contextData, wizardOpen, setWizardOpen } = useContextMenu();
    const [defaultWizardTab, setDefaultWizardTab] = useState<"onSite" | "offSite" | "knowledge">("onSite");
    const [interruptCount, setInterruptCount] = useState(0);

    const openWizard = (tab: "onSite" | "offSite" | "knowledge") => {
      setDefaultWizardTab(tab);
      setWizardOpen(true);
    };

    const handleInterruptCountChange = useCallback((count: number) => {
      setInterruptCount(count);
      onInterruptCountChange?.(count);
    }, [onInterruptCountChange]);

    // Calculate Counts
    const onSiteCounts = {
      // Brand Breakdown
      brandMeta: (contextData.onSite.brandInfo?.name ? 1 : 0) + (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#meta-subtitle").length || 0),
      brandLogo: (contextData.onSite.websiteContent?.filter((c: any) => c.url?.startsWith("#brand-logo")).length || 0),
      brandColors: (contextData.onSite.websiteContent?.filter((c: any) => c.url?.startsWith("#brand-color")).length || 0),
      brandFonts: (contextData.onSite.websiteContent?.filter((c: any) => c.url?.startsWith("#brand-font")).length || 0),
      brandTone: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#brand-tone").length || 0),
      brandLangs: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#brand-languages").length || 0),
      get brand() { return this.brandMeta + this.brandLogo + this.brandColors + this.brandFonts + this.brandTone + this.brandLangs; },

      // Pages Breakdown
      pagesCore: contextData.onSite.websiteContent?.filter((c: any) => ["home", "about", "career", "legal"].includes(c.type) || c.url === "#page-contact").length || 0,
      pagesProduct: contextData.onSite.websiteContent?.filter((c: any) => c.type === "pricing" || ["#page-products", "#page-features", "#page-solutions"].includes(c.url)).length || 0,
      pagesResources: contextData.onSite.websiteContent?.filter((c: any) => ["documentation", "faq", "case_study"].includes(c.type) || c.url === "#page-blog").length || 0,
      pagesLegal: contextData.onSite.websiteContent?.filter((c: any) => c.type === "legal" || ["#page-privacy", "#page-changelog", "#page-status"].includes(c.url)).length || 0,
      get pages() { return this.pagesCore + this.pagesProduct + this.pagesResources + this.pagesLegal; },

      landing: contextData.onSite.landingPages?.length || 0,
      blog: contextData.onSite.blogPosts?.length || 0,

      // Hero Breakdown
      heroHeadline: (contextData.onSite.brandInfo?.uniqueSellingPoints?.[0] ? 1 : 0),
      heroSubheadline: (contextData.onSite.brandInfo?.tagline ? 1 : 0),
      heroCTA: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#cta").length || 0),
      heroMedia: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#hero-media").length || 0),
      heroMetrics: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#metric").length || 0),
      get hero() { return this.heroHeadline + this.heroSubheadline + this.heroCTA + this.heroMedia + this.heroMetrics; },

      problem: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#problem").length || 0),
      audience: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#audience").length || 0),
      useCases: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#use-case").length || 0),
      industries: (contextData.onSite.websiteContent?.filter((c: any) => c.url === "#industry").length || 0),
      products: contextData.onSite.productsServices?.length || 0,

      // Social Proof Breakdown
      spTestimonials: contextData.onSite.websiteContent?.filter((c: any) => c.type === "testimonial").length || 0,
      spCases: contextData.onSite.websiteContent?.filter((c: any) => c.type === "case_study").length || 0,
      spBadges: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#logo").length || 0,
      spAwards: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#award").length || 0,
      spGuarantees: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#guarantee").length || 0,
      spIntegrations: contextData.onSite.websiteContent?.filter((c: any) => c.url === "#integration").length || 0,
      get socialProof() { return this.spTestimonials + this.spCases + this.spBadges + this.spAwards + this.spGuarantees + this.spIntegrations; },

      team: contextData.onSite.team?.length || 0,

      // About Breakdown
      aboutStory: (contextData.onSite.brandInfo?.foundingStory ? 1 : 0),
      aboutMission: (contextData.onSite.brandInfo?.mission ? 1 : 0) + (contextData.onSite.brandInfo?.vision ? 1 : 0),
      aboutValues: (contextData.onSite.brandInfo?.coreValues?.length || 0),
      get about() { return this.aboutStory + this.aboutMission + this.aboutValues; },

      faq: contextData.onSite.websiteContent?.filter((c: any) => c.type === "faq").length || 0,

      // Contact Breakdown
      contactPrimary: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-email", "#contact-sales", "#contact-phone"].includes(c.url)).length || 0,
      contactLocation: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-address", "#contact-hours", "#contact-timezone"].includes(c.url)).length || 0,
      contactSupport: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-support", "#support-chat", "#support-ticket", "#support-community"].includes(c.url)).length || 0,
      contactAdditional: contextData.onSite.websiteContent?.filter((c: any) => ["#contact-press", "#contact-partners", "#contact-careers", "#contact-newsletter"].includes(c.url)).length || 0,
      get contact() { return this.contactPrimary + this.contactLocation + this.contactSupport + this.contactAdditional; },
    };
    // Recalculate Total for OnSite
    const onSiteRealTotal = onSiteCounts.brand + onSiteCounts.pages + onSiteCounts.landing + onSiteCounts.blog + onSiteCounts.hero + onSiteCounts.problem + onSiteCounts.audience + onSiteCounts.useCases + onSiteCounts.industries + onSiteCounts.products + onSiteCounts.socialProof + onSiteCounts.team + onSiteCounts.about + onSiteCounts.faq + onSiteCounts.contact;

    const offSiteCounts = {
      // Owned Presence
      osOfficialChannels: contextData.offSite.socialAccounts?.length || 0,
      osExecutiveAccounts: contextData.offSite.executiveAccounts?.length || 0,
      get ownedPresence() { return this.osOfficialChannels + this.osExecutiveAccounts; },

      // Reviews & Listings
      osReviews: contextData.offSite.reviewPlatforms?.length || 0,
      osDirectories: contextData.offSite.directoryListings?.length || 0,
      osStorefronts: contextData.offSite.ecommercePlatforms?.length || 0,
      get reviewsListings() { return this.osReviews + this.osDirectories + this.osStorefronts; },

      // Community
      osForums: contextData.offSite.communities?.length || 0,
      osQA: contextData.offSite.qaPlatforms?.length || 0,
      osGroups: contextData.offSite.professionalNetworks?.length || 0,
      get community() { return this.osForums + this.osQA + this.osGroups; },

      // Media
      osMediaChannels: contextData.offSite.mediaSources?.length || 0,
      osCoverage: contextData.offSite.backlinks?.length || 0,
      osEvents: contextData.offSite.externalEvents?.length || 0,
      get media() { return this.osMediaChannels + this.osCoverage + this.osEvents; },

      // KOLs
      osCreators: contextData.offSite.influencerAccounts?.filter((i: any) => i.role === 'kol').length || 0,
      osExperts: contextData.offSite.influencerAccounts?.filter((i: any) => i.role === 'analyst').length || 0,
      osPress: contextData.offSite.influencerAccounts?.filter((i: any) => i.role === 'journalist' || i.role === 'media').length || 0,
      get kols() { return this.osCreators + this.osExperts + this.osPress; },
    };
    // Correct total calculation
    const offSiteTotal = offSiteCounts.ownedPresence + offSiteCounts.reviewsListings + offSiteCounts.community + offSiteCounts.media + offSiteCounts.kols;

    const knowledgeCounts = {
      uploaded: contextData.knowledge.sources?.filter((s: any) => s.type === 'uploaded').length || 0,
      linked: contextData.knowledge.sources?.filter((s: any) => s.type === 'linked').length || 0,
      pasted: contextData.knowledge.sources?.filter((s: any) => s.type === 'pasted').length || 0,
      imported: contextData.knowledge.sources?.filter((s: any) => s.type === 'imported').length || 0,
      saved: contextData.knowledge.sources?.filter((s: any) => s.type === 'saved').length || 0,
      get total() { return this.uploaded + this.linked + this.pasted + this.imported + this.saved; }
    };
    const knowledgeTotal = knowledgeCounts.total;

    return (
      <>
        <ContextWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          defaultTab={defaultWizardTab}
        />

        <div className="flex h-full flex-col p-2 pr-0">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
            <ResizablePanelGroup direction="vertical" autoSaveId="left-sidebar">
              {/* Context Module - Top Section */}
              <ResizablePanel
                id="context"
                order={1}
                defaultSize={45}
                minSize={25}
                className="group/context flex flex-col overflow-hidden"
              >
                <div className="flex-shrink-0 flex h-12 items-center justify-between px-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-muted-foreground" />
                    <span className="text-sm font-semibold tracking-wide">
                      Context
                    </span>
                  </div>
                  <button
                    onClick={() => openWizard("onSite")}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover/context:opacity-100"
                    aria-label="Add context"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-2">
                  <div className="space-y-1">
                    {/* On-site Tree */}
                    <TreeItem
                      label="On-site"
                      count={onSiteRealTotal}
                      icon={Network}
                      defaultExpanded={true}
                      onClick={() => openWizard("onSite")}
                    >
                      {/* Brand & Pages Column */}
                      <TreeItem label="Brand Assets" count={onSiteCounts.brand} icon={Paintbrush} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Meta Info" count={onSiteCounts.brandMeta} icon={FileText} level={2} />
                        <TreeItem label="Logo URL" count={onSiteCounts.brandLogo} icon={LinkIcon} level={2} />
                        <TreeItem label="Colors" count={onSiteCounts.brandColors} icon={Palette} level={2} />
                        <TreeItem label="Typography" count={onSiteCounts.brandFonts} icon={FileText} level={2} />
                        <TreeItem label="Tone" count={onSiteCounts.brandTone} icon={MessageSquare} level={2} />
                        <TreeItem label="Languages" count={onSiteCounts.brandLangs} icon={Globe} level={2} />
                      </TreeItem>

                      <TreeItem label="Key Website Pages" count={onSiteCounts.pages} icon={Layout} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Core Pages" count={onSiteCounts.pagesCore} icon={File} level={2} />
                        <TreeItem label="Product Pages" count={onSiteCounts.pagesProduct} icon={ShoppingBag} level={2} />
                        <TreeItem label="Resources" count={onSiteCounts.pagesResources} icon={Book} level={2} />
                        <TreeItem label="Legal & Updates" count={onSiteCounts.pagesLegal} icon={FileText} level={2} />
                      </TreeItem>

                      <TreeItem label="Landing Pages" count={onSiteCounts.landing} icon={Megaphone} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Blog & Resources" count={onSiteCounts.blog} icon={Book} level={1} onClick={() => openWizard("onSite")} />

                      {/* Content Column */}
                      <TreeItem label="Hero Section" count={onSiteCounts.hero} icon={Flag} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Headline" count={onSiteCounts.heroHeadline} icon={Type} level={2} />
                        <TreeItem label="Subheadline" count={onSiteCounts.heroSubheadline} icon={FileText} level={2} />
                        <TreeItem label="Call to Action" count={onSiteCounts.heroCTA} icon={Layout} level={2} />
                        <TreeItem label="Media" count={onSiteCounts.heroMedia} icon={FileText} level={2} />
                        <TreeItem label="Metrics" count={onSiteCounts.heroMetrics} icon={TrendingUp} level={2} />
                      </TreeItem>

                      <TreeItem label="Problem Statement" count={onSiteCounts.problem} icon={AlertCircle} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Who We Serve" count={onSiteCounts.audience} icon={Users} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Use Cases" count={onSiteCounts.useCases} icon={Zap} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Industries" count={onSiteCounts.industries} icon={Building} level={1} onClick={() => openWizard("onSite")} />
                      <TreeItem label="Products & Services" count={onSiteCounts.products} icon={ShoppingBag} level={1} onClick={() => openWizard("onSite")} />

                      <TreeItem label="Social Proof & Trust" count={onSiteCounts.socialProof} icon={Star} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Testimonials" count={onSiteCounts.spTestimonials} icon={MessageSquare} level={2} />
                        <TreeItem label="Case Studies" count={onSiteCounts.spCases} icon={FileText} level={2} />
                        <TreeItem label="Badges" count={onSiteCounts.spBadges} icon={CheckCircle} level={2} />
                        <TreeItem label="Awards" count={onSiteCounts.spAwards} icon={Star} level={2} />
                        <TreeItem label="Guarantees" count={onSiteCounts.spGuarantees} icon={CheckCircle} level={2} />
                        <TreeItem label="Integrations" count={onSiteCounts.spIntegrations} icon={LinkIcon} level={2} />
                      </TreeItem>

                      <TreeItem label="Leadership Team" count={onSiteCounts.team} icon={Users} level={1} onClick={() => openWizard("onSite")} />

                      <TreeItem label="About Us" count={onSiteCounts.about} icon={Info} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Company Story" count={onSiteCounts.aboutStory} icon={Book} level={2} />
                        <TreeItem label="Mission & Vision" count={onSiteCounts.aboutMission} icon={Target} level={2} />
                        <TreeItem label="Core Values" count={onSiteCounts.aboutValues} icon={Star} level={2} />
                      </TreeItem>

                      <TreeItem label="FAQ" count={onSiteCounts.faq} icon={HelpCircle} level={1} onClick={() => openWizard("onSite")} />

                      <TreeItem label="Contact Information" count={onSiteCounts.contact} icon={Mail} level={1} onClick={() => openWizard("onSite")}>
                        <TreeItem label="Primary Contact" count={onSiteCounts.contactPrimary} icon={Phone} level={2} />
                        <TreeItem label="Location & Hours" count={onSiteCounts.contactLocation} icon={MapPin} level={2} />
                        <TreeItem label="Support Channels" count={onSiteCounts.contactSupport} icon={HelpCircle} level={2} />
                        <TreeItem label="Additional" count={onSiteCounts.contactAdditional} icon={LayoutList} level={2} />
                      </TreeItem>

                    </TreeItem>

                    {/* Off-site Tree */}
                    <TreeItem
                      label="Off-site"
                      count={offSiteTotal}
                      icon={Globe}
                      onClick={() => openWizard("offSite")}
                    >
                      <TreeItem label="Owned Presence" count={offSiteCounts.ownedPresence} icon={Share2} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Official Channels" count={offSiteCounts.osOfficialChannels} icon={Globe} level={2} />
                        <TreeItem label="Executive Accounts" count={offSiteCounts.osExecutiveAccounts} icon={User} level={2} />
                      </TreeItem>

                      <TreeItem label="Reviews & Listings" count={offSiteCounts.reviewsListings} icon={Star} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Reviews" count={offSiteCounts.osReviews} icon={MessageSquare} level={2} />
                        <TreeItem label="Directories" count={offSiteCounts.osDirectories} icon={Folder} level={2} />
                        <TreeItem label="Storefronts" count={offSiteCounts.osStorefronts} icon={ShoppingBag} level={2} />
                      </TreeItem>

                      <TreeItem label="Community" count={offSiteCounts.community} icon={Users} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Forums" count={offSiteCounts.osForums} icon={MessageSquare} level={2} />
                        <TreeItem label="Q&A" count={offSiteCounts.osQA} icon={HelpCircle} level={2} />
                        <TreeItem label="Groups" count={offSiteCounts.osGroups} icon={Users} level={2} />
                      </TreeItem>

                      <TreeItem label="Media" count={offSiteCounts.media} icon={Newspaper} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Channels" count={offSiteCounts.osMediaChannels} icon={Megaphone} level={2} />
                        <TreeItem label="Coverage" count={offSiteCounts.osCoverage} icon={FileText} level={2} />
                        <TreeItem label="Events" count={offSiteCounts.osEvents} icon={Briefcase} level={2} />
                      </TreeItem>

                      <TreeItem label="KOLs" count={offSiteCounts.kols} icon={Target} level={1} onClick={() => openWizard("offSite")}>
                        <TreeItem label="Creators" count={offSiteCounts.osCreators} icon={Users} level={2} />
                        <TreeItem label="Experts" count={offSiteCounts.osExperts} icon={User} level={2} />
                        <TreeItem label="Press" count={offSiteCounts.osPress} icon={Newspaper} level={2} />
                      </TreeItem>
                    </TreeItem>

                    {/* Knowledge Tree */}
                    <TreeItem
                      label="Knowledge"
                      count={knowledgeTotal}
                      icon={BookOpen}
                      onClick={() => openWizard("knowledge")}
                    >
                      <TreeItem label="Uploaded" count={knowledgeCounts.uploaded} icon={Upload} level={1} onClick={() => openWizard("knowledge")} />
                      <TreeItem label="Linked" count={knowledgeCounts.linked} icon={LinkIcon} level={1} onClick={() => openWizard("knowledge")} />
                      <TreeItem label="Pasted" count={knowledgeCounts.pasted} icon={FileText} level={1} onClick={() => openWizard("knowledge")} />
                      <TreeItem label="Cloud & Notes" count={knowledgeCounts.imported} icon={Cloud} level={1} onClick={() => openWizard("knowledge")} />
                      <TreeItem label="Saved Artifacts" count={knowledgeCounts.saved} icon={Save} level={1} onClick={() => openWizard("knowledge")} />
                    </TreeItem>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Chats Module - Bottom Section */}
              <ResizablePanel
                id="chats"
                order={2}
                defaultSize={55}
                minSize={30}
                className="flex flex-col overflow-hidden"
              >
                <div className="flex-shrink-0 flex h-12 items-center gap-2 px-4 border-b border-border bg-muted/30">
                  <MessagesSquare size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold tracking-wide">
                    Chats
                  </span>
                  {interruptCount > 0 && (
                    <span className="ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                      {interruptCount}
                    </span>
                  )}
                </div>

                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <SidebarThreadList
                    onThreadSelect={onThreadSelect}
                    onInterruptCountChange={handleInterruptCountChange}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div >
      </>
    );
  }
);

LeftSidebar.displayName = "LeftSidebar";
