"use client";

import React, { useState, useCallback } from "react";
import {
  FileText,
  Layers,
  Download,
  FolderDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileItem } from "@/app/types/types";
import { FileViewDialog } from "@/app/components/FileViewDialog";
import { PlaybookFormDialog } from "@/app/components/PlaybookFormDialog";
import { type Playbook, type PlaybookCategory, playbooks } from "@/data/playbooks";
import { useChatContext } from "@/providers/ChatProvider";

const categoryTabs: { id: PlaybookCategory; label: string }[] = [
  { id: "research", label: "Research" },
  { id: "build", label: "Build" },
  { id: "optimize", label: "Optimize" },
  { id: "monitor", label: "Monitor" },
];

interface RightSidebarProps {
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => Promise<void>;
  editDisabled: boolean;
  onPlaybookSelect?: (playbookId: string) => void;
}

export const RightSidebar = React.memo<RightSidebarProps>(
  ({ files, setFiles, editDisabled, onPlaybookSelect }) => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<PlaybookCategory>("research");
    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
    const [playbookDialogOpen, setPlaybookDialogOpen] = useState(false);
    
    const { sendMessage } = useChatContext();

    const handleSaveFile = useCallback(
      async (fileName: string, content: string) => {
        await setFiles({ ...files, [fileName]: content });
        setSelectedFile({ path: fileName, content: content });
      },
      [files, setFiles]
    );

    const filteredPlaybooks = playbooks.filter((p) => p.category === activeCategory);

    const handlePlaybookClick = (playbook: Playbook) => {
      setSelectedPlaybook(playbook);
      setPlaybookDialogOpen(true);
      onPlaybookSelect?.(playbook.id);
    };

    const handlePlaybookSubmit = (prompt: string) => {
      // 直接发送消息，不再填充到输入框
      sendMessage(prompt);
      setPlaybookDialogOpen(false);
    };

    return (
      <div className="flex h-full flex-col p-2 pl-0">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
          {/* Playbooks Module */}
          <div className="group/playbooks flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="flex h-12 items-center gap-2 px-4 border-b border-border bg-muted/30">
              <Layers size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold tracking-wide">Playbooks</span>
            </div>
            
            {/* Category Tabs - 无图标 */}
            <div className="flex border-b border-border">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`
                    flex-1 py-2.5 text-xs font-medium transition-colors text-center
                    ${activeCategory === tab.id 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Playbook List */}
            <div className="px-3 py-3 max-h-[280px] overflow-y-auto">
              <div className="space-y-2">
                {filteredPlaybooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No playbooks in this category
                  </p>
                ) : (
                  filteredPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      onClick={() => handlePlaybookClick(playbook)}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-sm mb-1">{playbook.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {playbook.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Artifacts Module */}
          {(() => {
            const visibleFiles = Object.keys(files).filter(
              (f) => !f.startsWith("/large_tool_results/")
            );
            
            const getFileContent = (filePath: string): string => {
              const rawContent = files[filePath];
              if (typeof rawContent === "object" && rawContent !== null && "content" in rawContent) {
                const contentArray = (rawContent as { content: unknown }).content;
                return Array.isArray(contentArray) ? contentArray.join("\n") : String(contentArray || "");
              }
              return String(rawContent || "");
            };
            
            return (
              <div className="group/artifacts flex min-h-0 flex-1 flex-col border-t border-border">
                <div className="flex h-12 flex-shrink-0 items-center gap-2 px-4 border-b border-border bg-muted/30">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-sm font-semibold tracking-wide">Artifacts</span>
                  {visibleFiles.length > 0 && (
                    <span className="rounded-full bg-[#2F6868] px-2 py-0.5 text-xs font-medium text-white">
                      {visibleFiles.length}
                    </span>
                  )}
                  {visibleFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        visibleFiles.forEach((filePath) => {
                          const fileContent = getFileContent(filePath);
                          const fileName = filePath.split("/").pop() || filePath;
                          const blob = new Blob([fileContent], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = fileName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        });
                      }}
                      className="ml-auto rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover/artifacts:opacity-100"
                      title="Download All"
                    >
                      <FolderDown size={16} className="text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  {visibleFiles.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-4 pb-4">
                      <p className="text-xs text-muted-foreground">No artifacts created yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full px-4 py-4">
                      <div className="space-y-1">
                        {visibleFiles.map((filePath) => {
                          const fileContent = getFileContent(filePath);
                          const fileName = filePath.split("/").pop() || filePath;

                          const handleDownload = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            const blob = new Blob([fileContent], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          };

                          return (
                            <div
                              key={filePath}
                              className="group relative flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-accent"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFile({ path: filePath, content: fileContent })
                                }
                                className="flex flex-1 items-center gap-3 min-w-0"
                              >
                                <FileText size={16} className="flex-shrink-0 text-muted-foreground" />
                                <p className="min-w-0 flex-1 truncate text-sm font-medium text-left">
                                  {fileName}
                                </p>
                              </button>
                              <button
                                type="button"
                                onClick={handleDownload}
                                className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                                title="Download"
                              >
                                <Download size={16} className="text-muted-foreground" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {selectedFile && (
          <FileViewDialog
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}

        {selectedPlaybook && (
          <PlaybookFormDialog
            open={playbookDialogOpen}
            onOpenChange={setPlaybookDialogOpen}
            playbookId={selectedPlaybook.id}
            playbookTitle={selectedPlaybook.title}
            playbookDescription={selectedPlaybook.description}
            option={selectedPlaybook.options?.[0] || { label: '', value: '' }}
            onSubmit={handlePlaybookSubmit}
          />
        )}
      </div>
    );
  }
);

RightSidebar.displayName = "RightSidebar";
