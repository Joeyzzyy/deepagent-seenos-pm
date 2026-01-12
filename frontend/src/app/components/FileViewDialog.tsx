"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { FileText, Copy, Download, Eye, Code } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import type { FileItem } from "@/app/types/types";
import useSWRMutation from "swr/mutation";

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  cpp: "cpp",
  c: "c",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  scala: "scala",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  json: "json",
  xml: "xml",
  html: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  sql: "sql",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  dockerfile: "dockerfile",
  makefile: "makefile",
};

export const FileViewDialog = React.memo<{
  file: FileItem | null;
  onClose: () => void;
}>(({ file, onClose }) => {
  const fileName = String(file?.path || "");
  const fileContent = String(file?.content || "");

  const fileExtension = useMemo(() => {
    const fileNameStr = String(fileName || "");
    return fileNameStr.split(".").pop()?.toLowerCase() || "";
  }, [fileName]);

  const isMarkdown = useMemo(() => {
    return fileExtension === "md" || fileExtension === "markdown";
  }, [fileExtension]);

  const isHtml = useMemo(() => {
    return fileExtension === "html" || fileExtension === "htm";
  }, [fileExtension]);

  // For HTML files: "preview" or "code" view mode
  const [htmlViewMode, setHtmlViewMode] = useState<"preview" | "code">("preview");

  // Reset view mode when file changes
  useEffect(() => {
    setHtmlViewMode("preview");
  }, [file]);

  const language = useMemo(() => {
    return LANGUAGE_MAP[fileExtension] || "text";
  }, [fileExtension]);

  const handleCopy = useCallback(() => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
    }
  }, [fileContent]);

  const handleDownload = useCallback(() => {
    if (fileContent && fileName) {
      const blob = new Blob([fileContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [fileContent, fileName]);

  return (
    <Dialog
      open={true}
      onOpenChange={onClose}
    >
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] sm:w-[95vw] sm:max-w-[95vw] md:w-[95vw] md:max-w-[95vw] lg:w-[95vw] lg:max-w-[95vw] flex-col p-6">
        <DialogTitle className="sr-only">
          {file?.path || "New File"}
        </DialogTitle>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="text-primary/50 h-5 w-5 shrink-0" />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-medium text-primary">
              {file?.path}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {/* HTML view mode toggle */}
            {isHtml && (
              <div className="mr-2 flex rounded-md border border-border">
                <Button
                  onClick={() => setHtmlViewMode("preview")}
                  variant={htmlViewMode === "preview" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 rounded-r-none px-2"
                >
                  <Eye size={14} className="mr-1" />
                  Preview
                </Button>
                <Button
                  onClick={() => setHtmlViewMode("code")}
                  variant={htmlViewMode === "code" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 rounded-l-none border-l border-border px-2"
                >
                  <Code size={14} className="mr-1" />
                  Code
                </Button>
              </div>
            )}
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <Copy
                size={16}
                className="mr-1"
              />
              Copy
            </Button>
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <Download
                size={16}
                className="mr-1"
              />
              Download
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {isHtml && htmlViewMode === "preview" && fileContent ? (
            <div className="h-full rounded-md border border-border bg-white">
              <iframe
                srcDoc={fileContent}
                title="HTML Preview"
                className="h-full w-full rounded-md"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <ScrollArea className="bg-surface h-full rounded-md">
              <div className="p-4">
                {fileContent ? (
                  isMarkdown ? (
                    <div className="rounded-md p-6">
                      <MarkdownContent content={fileContent} />
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                      showLineNumbers
                      wrapLines={true}
                      lineProps={{
                        style: {
                          whiteSpace: "pre-wrap",
                        },
                      }}
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  )
                ) : (
                  <div className="flex items-center justify-center p-12">
                    <p className="text-sm text-muted-foreground">
                      File is empty
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

FileViewDialog.displayName = "FileViewDialog";
