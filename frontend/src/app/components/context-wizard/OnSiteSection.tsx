"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Palette, ShoppingBag, Layout, Users } from "lucide-react";
import { OnSiteContext, ProductService, TeamMember, WebsiteContent } from "@/app/types/context";
import { v4 as uuidv4 } from "uuid";

interface OnSiteSectionProps {
  data: OnSiteContext;
  onUpdate: (data: Partial<OnSiteContext>) => void;
}

export function OnSiteSection({ data, onUpdate }: OnSiteSectionProps) {
  // Product/Service helpers
  const addProduct = () => {
    onUpdate({
      productsServices: [...data.productsServices, { id: uuidv4(), name: "", type: "product" }],
    });
  };

  const updateProduct = (id: string, updates: Partial<ProductService>) => {
    onUpdate({
      productsServices: data.productsServices.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  };

  const removeProduct = (id: string) => {
    onUpdate({
      productsServices: data.productsServices.filter((p) => p.id !== id),
    });
  };

  // Team helpers
  const addTeamMember = () => {
    onUpdate({
      team: [...data.team, { id: uuidv4(), name: "", role: "" }],
    });
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    onUpdate({
      team: data.team.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
  };

  const removeTeamMember = (id: string) => {
    onUpdate({
      team: data.team.filter((t) => t.id !== id),
    });
  };

  // Website content helpers
  const addWebsitePage = () => {
    onUpdate({
      websiteContent: [...data.websiteContent, { id: uuidv4(), name: "", url: "", type: "other" }],
    });
  };

  const updateWebsitePage = (id: string, updates: Partial<WebsiteContent>) => {
    onUpdate({
      websiteContent: data.websiteContent.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    });
  };

  const removeWebsitePage = (id: string) => {
    onUpdate({
      websiteContent: data.websiteContent.filter((w) => w.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      {/* Brand Info */}
      <section id="brand-info" className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Brand Info</h3>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand Name *</Label>
              <Input
                placeholder="Your company or product name"
                value={data.brandInfo.name}
                onChange={(e) =>
                  onUpdate({ brandInfo: { ...data.brandInfo, name: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input
                placeholder="yourdomain.com"
                value={data.brandInfo.domain || ""}
                onChange={(e) =>
                  onUpdate({ brandInfo: { ...data.brandInfo, domain: e.target.value } })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                placeholder="Your slogan or tagline"
                value={data.brandInfo.tagline || ""}
                onChange={(e) =>
                  onUpdate({ brandInfo: { ...data.brandInfo, tagline: e.target.value } })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mission</Label>
            <Textarea
              placeholder="What is your company's mission?"
              value={data.brandInfo.mission || ""}
              onChange={(e) =>
                onUpdate({ brandInfo: { ...data.brandInfo, mission: e.target.value } })
              }
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Target Market</Label>
            <Input
              placeholder="Who are your ideal customers?"
              value={data.brandInfo.targetMarket || ""}
              onChange={(e) =>
                onUpdate({ brandInfo: { ...data.brandInfo, targetMarket: e.target.value } })
              }
            />
          </div>
        </div>
      </section>

      {/* Products & Services */}
      <section id="products-services" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Products & Services</h3>
            <span className="text-sm text-muted-foreground">({data.productsServices.length})</span>
          </div>
          <Button variant="outline" size="sm" onClick={addProduct}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-4">
          {data.productsServices.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:bg-muted/50"
              onClick={addProduct}
            >
              Click to add your first product or service
            </div>
          ) : (
            data.productsServices.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Product/Service Name"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                    />
                    <Input
                      placeholder="URL (optional)"
                      value={product.url || ""}
                      onChange={(e) => updateProduct(product.id, { url: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Description..."
                  value={product.description || ""}
                  onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Website Pages */}
      <section id="website-pages" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Website Pages</h3>
            <span className="text-sm text-muted-foreground">({data.websiteContent.length})</span>
          </div>
          <Button variant="outline" size="sm" onClick={addWebsitePage}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {data.websiteContent.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground cursor-pointer hover:bg-muted/50"
              onClick={addWebsitePage}
            >
              Add website pages (Home, About, Pricing, etc.)
            </div>
          ) : (
            data.websiteContent.map((page) => (
              <div key={page.id} className="flex items-center gap-2 group">
                <select
                  className="h-9 w-28 rounded-md border bg-background px-2 text-sm"
                  value={page.type}
                  onChange={(e) =>
                    updateWebsitePage(page.id, { type: e.target.value as WebsiteContent["type"] })
                  }
                >
                  <option value="home">Home</option>
                  <option value="about">About</option>
                  <option value="pricing">Pricing</option>
                  <option value="faq">FAQ</option>
                  <option value="documentation">Docs</option>
                  <option value="other">Other</option>
                </select>
                <Input
                  placeholder="Page Name"
                  value={page.name}
                  onChange={(e) => updateWebsitePage(page.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="https://..."
                  value={page.url}
                  onChange={(e) => updateWebsitePage(page.id, { url: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => removeWebsitePage(page.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Team</h3>
            <span className="text-sm text-muted-foreground">({data.team.length})</span>
          </div>
          <Button variant="outline" size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {data.team.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground cursor-pointer hover:bg-muted/50"
              onClick={addTeamMember}
            >
              Add team members
            </div>
          ) : (
            data.team.map((member) => (
              <div key={member.id} className="flex items-center gap-2 group">
                <Input
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => updateTeamMember(member.id, { name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="Role/Title"
                  value={member.role}
                  onChange={(e) => updateTeamMember(member.id, { role: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="LinkedIn URL (optional)"
                  value={member.linkedin || ""}
                  onChange={(e) => updateTeamMember(member.id, { linkedin: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => removeTeamMember(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

