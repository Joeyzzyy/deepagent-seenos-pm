// src/app/types/context.ts

export type ContextStatus = "active" | "inactive" | "draft" | "archived" | "pending";
export type Sentiment = "positive" | "neutral" | "negative";
export type VerificationStatus = "verified" | "unverified";

// ---------------------------
// OnSite (Internal / Organization)
// ---------------------------

export interface BrandAsset {
  id: string;
  name: string;
  type:
  | "logo"
  | "color_palette"
  | "typography"
  | "icon"
  | "image"
  | "video"
  | "guideline"
  | "other";
  url?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface PricingPlan {
  name: string;      // e.g. "Free", "Pro", "Enterprise"
  price: string;     // e.g. "$0", "$29/mo", "Custom"
  features?: string[]; // Features included in this plan
}

export interface ProductService {
  id: string;
  name: string;
  type: "product" | "service" | "subscription";
  url?: string;
  description?: string;
  price?: string;           // Simple single price (legacy/simple use)
  pricingPlans?: PricingPlan[]; // Multiple pricing tiers
  features?: string[];
  benefits?: string[];
  howItWorks?: string[];
}

export interface LandingPage {
  id: string;
  name: string;
  url: string;
  type: "product" | "campaign" | "event" | "signup" | "download" | "other";
  status: ContextStatus;
  description?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  url: string;
  category?: string;
  status: "published" | "draft" | "archived";
  publishDate?: string;
  tags?: string[];
}

export interface WebsiteContent {
  id: string;
  name: string;
  url: string;
  type:
  | "home"
  | "about"
  | "pricing"
  | "faq"
  | "case_study"
  | "testimonial"
  | "documentation"
  | "career"
  | "legal"
  | "other";
  description?: string;
}

export interface BrandInfo {
  name: string;
  domain?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  coreValues?: string[];
  targetMarket?: string;
  uniqueSellingPoints?: string[];
  foundingStory?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  linkedin?: string;
}

export interface OnSiteContext {
  brandInfo: BrandInfo;
  brandAssets: BrandAsset[];
  productsServices: ProductService[];
  landingPages: LandingPage[];
  blogPosts: BlogPost[];
  websiteContent: WebsiteContent[];
  team: TeamMember[];
}

// ---------------------------
// OffSite (External / Market)
// ---------------------------

export interface PressRelease {
  id: string;
  title: string;
  url: string;
  type: "press_release" | "media_coverage" | "interview" | "news_mention";
  source: string;
  publishDate?: string;
  summary?: string;
  sentiment?: Sentiment;
}

export interface OfficialAccount {
  id: string;
  platform:
  | "wechat"
  | "weibo"
  | "douyin"
  | "xiaohongshu"
  | "bilibili"
  | "zhihu"
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "other";
  accountName: string;
  url: string;
  followerCount?: number;
  verificationStatus?: VerificationStatus;
  description?: string;
}

export interface SocialMediaContent {
  id: string;
  platform: string;
  type: "kol" | "koc" | "ugc" | "paid_partnership";
  creatorName: string;
  contentUrl: string;
  contentType: "post" | "video" | "story" | "live" | "review";
  sentiment?: Sentiment;
  tags?: string[];
  description?: string;
}

export interface Partnership {
  id: string;
  name: string;
  type:
  | "distributor"
  | "reseller"
  | "affiliate"
  | "integration"
  | "media_partner"
  | "technology"
  | "other";
  url?: string;
  description?: string;
  status: "active" | "inactive" | "pending";
}

export interface CustomerReview {
  id: string;
  source: string;
  reviewerName?: string;
  rating?: number;
  content: string;
  date?: string;
  url?: string;
}

// ---------------------------
// New Off-site Monitoring Interfaces
// ---------------------------

export interface MonitoringScope {
  brandKeywords: string[];
  domainName: string;
  productKeywords: string[];
  hashtags: string[];
  keyPersons: string[];
  languages: string[];
  regions: string[];
  requiredKeywords: string[];
  excludedKeywords: string[];
}

export interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  url: string;
  isPriority: boolean;
}

export interface CommunityForum {
  id: string;
  platformType: string;
  communityName: string;
  url: string;
  tags: string[];
}

export interface QAPlatform {
  id: string;
  platform: string;
  monitoringKeywords: string[];
}

export interface MediaSource {
  id: string;
  name: string;
  type: 'news' | 'media' | 'blog' | 'media_group';
  url: string;
}

export interface VideoPlatform {
  id: string;
  platform: string;
  channelUrl: string;
  keywords: string[];
}

export interface PodcastNewsletter {
  id: string;
  name: string;
  platform: string;
  url: string;
  type: 'podcast' | 'newsletter';
}

export interface ReviewPlatform {
  id: string;
  platform: string;
  profileUrl: string;
  fetchDetails: boolean;
}

export interface AppStore {
  id: string;
  platform: string;
  appName: string;
  storeUrl: string;
  regions: string[];
}

export interface VerticalReviewSite {
  id: string;
  platformName: string;
  pageUrl: string;
  ratingMapping: string;
}

export interface EcommercePlatform {
  id: string;
  platform: string;
  storeName: string;
  storeUrl: string;
  collectReviews: boolean;
  collectQA: boolean;
  collectRatings: boolean;
  collectSalesRank: boolean;
}

export interface CompetitorConfig {
  id: string;
  name: string;
  brandKeywords: string[];
  domain: string;
  socialAccounts: string[];
  reviewLinks: string[];
  includeInSOV: boolean;
}

export interface InfluencerAccount {
  id: string;
  name: string;
  platform: string;
  url: string;
  role: 'kol' | 'analyst' | 'journalist' | 'media';
  tier: '1' | '2' | '3';
}

export interface ExecutiveAccount {
  id: string;
  name: string;
  title: string;
  platform: string;
  handle: string;
}

export interface PartnerAccount {
  id: string;
  companyName: string;
  platform: string;
  handle: string;
}

export interface ProfessionalNetwork {
  id: string;
  platform: string; // LinkedIn, Maimai, Blind, etc.
  groupName: string;
  url: string;
}

export interface SearchEngineTracking {
  id: string;
  engine: string; // Google, Bing, Baidu
  keywords: string[];
  region: string;
  trackRanking: boolean;
}

export interface SERPCompetitor {
  id: string;
  keyword: string;
  topURLs: string[];
  trackChanges: boolean;
}

export interface DirectoryListing {
  id: string;
  directoryName: string; // ProductHunt, AlternativeTo, etc.
  listingUrl: string;
}

export interface GuestPost {
  id: string;
  title: string;
  publicationName: string;
  publicationUrl: string;
  authorName?: string;
  publishDate?: string;
  status: 'published' | 'pending' | 'draft';
}

export interface BacklinkSource {
  id: string;
  domain: string;
  pageUrl?: string;
  anchorText?: string;
  type: 'editorial' | 'guest_post' | 'directory' | 'forum' | 'other';
  doFollow: boolean;
}

export interface ExternalEvent {
  id: string;
  name: string;
  type: 'conference' | 'webinar' | 'podcast_appearance' | 'workshop' | 'meetup' | 'other';
  url?: string;
  date?: string;
  role: 'speaker' | 'sponsor' | 'attendee' | 'host';
}

export interface MetricsConfig {
  trackMentionsVolume: boolean;
  trackSentiment: boolean;
  trackReach: boolean;
  trackEngagement: boolean;
  trackShareOfVoice: boolean;
  trackReputationScore: boolean;
  trackTopSources: boolean;
  benchmarkPeriod?: '7d' | '30d' | '90d';
  trackCompetitorSOV?: boolean;
}

export interface CollectionSettings {
  frequency?: 'realtime' | 'hourly' | 'daily';
  historicalDepth?: '7d' | '30d' | '90d' | 'custom';
  excludeBots?: boolean;
  verifiedOnly?: boolean;
  minEngagement?: number;
}

export interface AlertRule {
  id: string;
  channel: 'email' | 'slack' | 'webhook';
  metric: string;
  timeWindow: '1h' | '24h' | '7d';
  thresholdType: 'percentage' | 'absolute';
  thresholdValue: number;
  sourceFilters: string[];
  silencePeriodMinutes: number;
}

export interface AlertConfig {
  channels: ('email' | 'slack' | 'webhook')[];
  rules: AlertRule[];
}

export interface OffSiteContext {
  // New monitoring fields
  monitoringScope: MonitoringScope;
  socialAccounts: SocialAccount[];
  executiveAccounts: ExecutiveAccount[];
  partnerAccounts: PartnerAccount[];
  communities: CommunityForum[];
  qaPlatforms: QAPlatform[];
  professionalNetworks: ProfessionalNetwork[];
  mediaSources: MediaSource[];
  videoPlatforms: VideoPlatform[];
  podcastNewsletters: PodcastNewsletter[];
  reviewPlatforms: ReviewPlatform[];
  appStores: AppStore[];
  verticalReviewSites: VerticalReviewSite[];
  ecommercePlatforms: EcommercePlatform[];
  competitorConfigs: CompetitorConfig[];
  influencerAccounts: InfluencerAccount[];
  searchEngineTracking: SearchEngineTracking[];
  serpCompetitors: SERPCompetitor[];
  directoryListings: DirectoryListing[];
  // Earned Media fields
  guestPosts: GuestPost[];
  backlinks: BacklinkSource[];
  externalEvents: ExternalEvent[];
  // Config
  metricsConfig: MetricsConfig;
  alertConfig: AlertConfig;
  collectionSettings?: CollectionSettings;
  // Legacy fields for backwards compatibility
  officialAccounts: OfficialAccount[];
  pressReleases: PressRelease[];
  socialMediaContent: SocialMediaContent[];
  partnerships: Partnership[];
  customerReviews: CustomerReview[];
}

// ---------------------------
// Knowledge (Intelligence / Data)
// ---------------------------

export interface Competitor {
  id: string;
  name: string;
  website?: string;
  description?: string;
  category: "direct" | "indirect" | "potential";
  strengths?: string[];
  weaknesses?: string[];
  pricing?: string;
}

export interface UserUpload {
  id: string;
  fileName: string;
  fileType: "pdf" | "doc" | "ppt" | "xls" | "image" | "video" | "csv" | "txt" | "md" | "other";
  category:
  | "market_research"
  | "user_research"
  | "brand_guideline"
  | "competitor_analysis"
  | "internal_doc"
  | "report"
  | "data_set"
  | "other";
  description?: string;
  uploadedAt: string;
  url?: string;
  content?: string;
}

export interface AgentGeneratedContent {
  id: string;
  title: string;
  type: "analysis" | "strategy" | "content_draft" | "summary" | "recommendation" | "report";
  content: string;
  generatedAt: string;
  isSaved: boolean;
  tags?: string[];
}

export interface MarketIntelligence {
  id: string;
  title: string;
  type: "industry_report" | "market_trend" | "regulation" | "news" | "statistics";
  source: string;
  url?: string;
  summary?: string;
  year?: string;
}

export interface AudiencePersona {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  painPoints?: string[];
  goals?: string[];
  buyingBehavior?: string;
}

// NotebookLM-style unified source type
export interface KnowledgeSource {
  id: string;
  title: string;
  type: "uploaded" | "linked" | "pasted" | "imported" | "saved";
  sourceType?: "pdf" | "doc" | "txt" | "md" | "csv" | "image" | "audio" | "video" | "webpage" | "youtube" | "github" | "google_scholar" | "google_drive" | "onedrive" | "notion" | "obsidian" | "plain_text" | "markdown" | "rich_text" | "code" | "copied_text" | "other";
  url?: string;
  content?: string;
  summary?: string;
  addedAt: string;
  category?: "market_research" | "user_research" | "brand_guideline" | "competitor_analysis" | "internal_doc" | "report" | "data_set" | "other";
  tags?: string[];
  isSaved?: boolean;  // For agent-generated content that user saved
}

export interface KnowledgeContext {
  // New unified sources array (NotebookLM style)
  sources: KnowledgeSource[];
  sourceLimit: number;
  // Legacy fields for backwards compatibility
  competitors: Competitor[];
  audiencePersonas: AudiencePersona[];
  marketIntelligence: MarketIntelligence[];
  userUploads: UserUpload[];
  agentGenerated: AgentGeneratedContent[];
}

// ---------------------------
// Main Context Data
// ---------------------------

export interface ContextData {
  onSite: OnSiteContext;
  offSite: OffSiteContext;
  knowledge: KnowledgeContext;
  metadata: {
    lastUpdated: string;
    version: string;
  };
}

// ---------------------------
// Initial State
// ---------------------------

export const initialContextData: ContextData = {
  onSite: {
    brandInfo: { name: "" },
    brandAssets: [],
    productsServices: [],
    landingPages: [],
    blogPosts: [],
    websiteContent: [],
    team: [],
  },
  offSite: {
    monitoringScope: {
      brandKeywords: [],
      domainName: '',
      productKeywords: [],
      hashtags: [],
      keyPersons: [],
      languages: [],
      regions: [],
      requiredKeywords: [],
      excludedKeywords: [],
    },
    socialAccounts: [],
    executiveAccounts: [],
    partnerAccounts: [],
    communities: [],
    qaPlatforms: [],
    professionalNetworks: [],
    mediaSources: [],
    videoPlatforms: [],
    podcastNewsletters: [],
    reviewPlatforms: [],
    appStores: [],
    verticalReviewSites: [],
    ecommercePlatforms: [],
    competitorConfigs: [],
    influencerAccounts: [],
    searchEngineTracking: [],
    serpCompetitors: [],
    directoryListings: [],
    guestPosts: [],
    backlinks: [],
    externalEvents: [],
    metricsConfig: {
      trackMentionsVolume: true,
      trackSentiment: true,
      trackReach: false,
      trackEngagement: false,
      trackShareOfVoice: false,
      trackReputationScore: false,
      trackTopSources: false,
      benchmarkPeriod: '30d',
      trackCompetitorSOV: false,
    },
    alertConfig: {
      channels: [],
      rules: [],
    },
    collectionSettings: {
      frequency: 'daily',
      historicalDepth: '30d',
      excludeBots: false,
      verifiedOnly: false,
      minEngagement: 0,
    },
    officialAccounts: [],
    pressReleases: [],
    socialMediaContent: [],
    partnerships: [],
    customerReviews: [],
  },
  knowledge: {
    sources: [],
    sourceLimit: 50,
    competitors: [],
    audiencePersonas: [],
    marketIntelligence: [],
    userUploads: [],
    agentGenerated: [],
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
    version: "2.0.0",
  },
};



