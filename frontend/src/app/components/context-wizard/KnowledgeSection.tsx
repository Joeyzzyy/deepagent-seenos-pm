"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, BookOpen, Link, FileText, Upload } from "lucide-react";
import { KnowledgeContext, KnowledgeSource } from "@/app/types/context";
import { v4 as uuidv4 } from "uuid";

interface KnowledgeSectionProps {
  data: KnowledgeContext;
  onUpdate: (data: Partial<KnowledgeContext>) => void;
}

export function KnowledgeSection({ data, onUpdate }: KnowledgeSectionProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newPastedContent, setNewPastedContent] = useState("");
  const [newPastedTitle, setNewPastedTitle] = useState("");

  // Add URL source
  const addUrlSource = () => {
    if (!newUrl.trim()) return;
    
    const newSource: KnowledgeSource = {
      id: uuidv4(),
      title: new URL(newUrl).hostname,
      type: "linked",
      sourceType: "webpage",
      url: newUrl,
      addedAt: new Date().toISOString(),
    };
    
    onUpdate({
      sources: [...(data.sources || []), newSource],
    });
    setNewUrl("");
  };

  // Add pasted content
  const addPastedContent = () => {
    if (!newPastedContent.trim()) return;
    
    const newSource: KnowledgeSource = {
      id: uuidv4(),
      title: newPastedTitle || "Pasted Content",
      type: "pasted",
      sourceType: "plain_text",
      content: newPastedContent,
      addedAt: new Date().toISOString(),
    };
    
    onUpdate({
      sources: [...(data.sources || []), newSource],
    });
    setNewPastedContent("");
    setNewPastedTitle("");
  };

  // Remove source
  const removeSource = (id: string) => {
    onUpdate({
      sources: (data.sources || []).filter((s) => s.id !== id),
    });
  };

  const linkedSources = (data.sources || []).filter((s) => s.type === "linked");
  const pastedSources = (data.sources || []).filter((s) => s.type === "pasted");
  const uploadedSources = (data.sources || []).filter((s) => s.type === "uploaded");

  return (
    <div className="space-y-8">
      {/* Knowledge Sources */}
      <section id="knowledge-sources" className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Knowledge Sources</h3>
          <span className="text-sm text-muted-foreground">
            ({(data.sources || []).length} / {data.sourceLimit || 50})
          </span>
        </div>

        {/* Add URL */}
        <div className="space-y-3 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Add from URL</Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/article"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrlSource()}
              className="flex-1"
            />
            <Button onClick={addUrlSource} disabled={!newUrl.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          
          {/* Linked sources list */}
          {linkedSources.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              {linkedSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group"
                >
                  <Link className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1" title={source.url}>
                    {source.title || source.url}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => removeSource(source.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paste Content */}
        <div className="space-y-3 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Paste Content</Label>
          </div>
          <Input
            placeholder="Title (optional)"
            value={newPastedTitle}
            onChange={(e) => setNewPastedTitle(e.target.value)}
          />
          <Textarea
            placeholder="Paste your text content here..."
            value={newPastedContent}
            onChange={(e) => setNewPastedContent(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={addPastedContent} disabled={!newPastedContent.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add Content
          </Button>

          {/* Pasted sources list */}
          {pastedSources.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              {pastedSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{source.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {(source.content?.length || 0).toLocaleString()} chars
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => removeSource(source.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Files (placeholder) */}
        <div className="space-y-3 p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Upload Files</Label>
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Drag & drop files here, or click to browse</p>
            <p className="text-xs mt-1">PDF, DOC, TXT, MD, CSV supported</p>
          </div>

          {/* Uploaded sources list */}
          {uploadedSources.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              {uploadedSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{source.title}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {source.sourceType}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => removeSource(source.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

