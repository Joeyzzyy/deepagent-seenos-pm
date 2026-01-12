"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, Share2, Star, Target } from "lucide-react";
import { OffSiteContext, SocialAccount, CompetitorConfig } from "@/app/types/context";
import { v4 as uuidv4 } from "uuid";

interface OffSiteSectionProps {
  data: OffSiteContext;
  onUpdate: (data: Partial<OffSiteContext>) => void;
}

export function OffSiteSection({ data, onUpdate }: OffSiteSectionProps) {
  // Social Account helpers
  const addSocialAccount = () => {
    onUpdate({
      socialAccounts: [
        ...data.socialAccounts,
        { id: uuidv4(), platform: "twitter", accountName: "", url: "", isPriority: false },
      ],
    });
  };

  const updateSocialAccount = (id: string, updates: Partial<SocialAccount>) => {
    onUpdate({
      socialAccounts: data.socialAccounts.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  };

  const removeSocialAccount = (id: string) => {
    onUpdate({
      socialAccounts: data.socialAccounts.filter((s) => s.id !== id),
    });
  };

  // Competitor helpers
  const addCompetitor = () => {
    onUpdate({
      competitorConfigs: [
        ...data.competitorConfigs,
        {
          id: uuidv4(),
          name: "",
          brandKeywords: [],
          domain: "",
          socialAccounts: [],
          reviewLinks: [],
          includeInSOV: true,
        },
      ],
    });
  };

  const updateCompetitor = (id: string, updates: Partial<CompetitorConfig>) => {
    onUpdate({
      competitorConfigs: data.competitorConfigs.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCompetitor = (id: string) => {
    onUpdate({
      competitorConfigs: data.competitorConfigs.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      {/* Social Accounts */}
      <section id="social-accounts" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Social Accounts</h3>
            <span className="text-sm text-muted-foreground">({data.socialAccounts.length})</span>
          </div>
          <Button variant="outline" size="sm" onClick={addSocialAccount}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {data.socialAccounts.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground cursor-pointer hover:bg-muted/50"
              onClick={addSocialAccount}
            >
              Add your social media accounts
            </div>
          ) : (
            data.socialAccounts.map((account) => (
              <div key={account.id} className="flex items-center gap-2 group">
                <select
                  className="h-9 w-32 rounded-md border bg-background px-2 text-sm"
                  value={account.platform}
                  onChange={(e) =>
                    updateSocialAccount(account.id, { platform: e.target.value })
                  }
                >
                  <option value="twitter">Twitter/X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="wechat">WeChat</option>
                  <option value="weibo">Weibo</option>
                  <option value="other">Other</option>
                </select>
                <Input
                  placeholder="Account Name / Handle"
                  value={account.accountName}
                  onChange={(e) =>
                    updateSocialAccount(account.id, { accountName: e.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Profile URL"
                  value={account.url}
                  onChange={(e) => updateSocialAccount(account.id, { url: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => removeSocialAccount(account.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reviews & Listings */}
      <section id="reviews" className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Star className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Reviews & Listings</h3>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Review Platform URLs</Label>
            <p className="text-xs text-muted-foreground">
              Add links to your profiles on G2, Capterra, TrustPilot, etc.
            </p>
            <div className="space-y-2">
              {(data.reviewPlatforms || []).length === 0 ? (
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground cursor-pointer hover:bg-muted/50 text-sm"
                  onClick={() =>
                    onUpdate({
                      reviewPlatforms: [
                        ...(data.reviewPlatforms || []),
                        { id: uuidv4(), platform: "", profileUrl: "", fetchDetails: true },
                      ],
                    })
                  }
                >
                  Add review platform profiles
                </div>
              ) : (
                data.reviewPlatforms.map((platform) => (
                  <div key={platform.id} className="flex items-center gap-2 group">
                    <Input
                      placeholder="Platform (e.g., G2, Capterra)"
                      value={platform.platform}
                      onChange={(e) =>
                        onUpdate({
                          reviewPlatforms: data.reviewPlatforms.map((p) =>
                            p.id === platform.id ? { ...p, platform: e.target.value } : p
                          ),
                        })
                      }
                      className="w-40"
                    />
                    <Input
                      placeholder="Profile URL"
                      value={platform.profileUrl}
                      onChange={(e) =>
                        onUpdate({
                          reviewPlatforms: data.reviewPlatforms.map((p) =>
                            p.id === platform.id ? { ...p, profileUrl: e.target.value } : p
                          ),
                        })
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() =>
                        onUpdate({
                          reviewPlatforms: data.reviewPlatforms.filter(
                            (p) => p.id !== platform.id
                          ),
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              {(data.reviewPlatforms || []).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onUpdate({
                      reviewPlatforms: [
                        ...data.reviewPlatforms,
                        { id: uuidv4(), platform: "", profileUrl: "", fetchDetails: true },
                      ],
                    })
                  }
                >
                  <Plus className="h-3 w-3 mr-1" /> Add More
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Competitors */}
      <section id="competitors" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Competitors</h3>
            <span className="text-sm text-muted-foreground">
              ({data.competitorConfigs.length})
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={addCompetitor}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-4">
          {data.competitorConfigs.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground cursor-pointer hover:bg-muted/50"
              onClick={addCompetitor}
            >
              Add competitors to track
            </div>
          ) : (
            data.competitorConfigs.map((competitor) => (
              <div key={competitor.id} className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Competitor Name"
                      value={competitor.name}
                      onChange={(e) =>
                        updateCompetitor(competitor.id, { name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Domain (e.g., competitor.com)"
                      value={competitor.domain}
                      onChange={(e) =>
                        updateCompetitor(competitor.id, { domain: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitor(competitor.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

