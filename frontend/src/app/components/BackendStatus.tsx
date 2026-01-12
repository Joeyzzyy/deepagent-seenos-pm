"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getConfig, getActiveApiKey } from "@/lib/config";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "disconnected" | "checking";

export function BackendStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");

  const checkConnection = useCallback(async () => {
    const config = getConfig();
    const apiKey = getActiveApiKey(config);
    const deploymentUrl = config?.deploymentUrl;

    if (!deploymentUrl) {
      setStatus("disconnected");
      return;
    }

    try {
      // Try the /info endpoint first, then /ok, then /assistants
      const endpoints = ["/info", "/ok", "/assistants"];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${deploymentUrl}${endpoint}`, {
            method: "GET",
            headers: apiKey ? { "x-api-key": apiKey } : {},
          });
          
          if (response.ok || response.status === 200) {
            setStatus("connected");
            return;
          }
        } catch {
          // Try next endpoint
        }
      }
      
      setStatus("disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  const statusConfig = {
    connected: {
      label: "Backend Online",
      color: "text-emerald-400/60",
    },
    disconnected: {
      label: "Backend Offline", 
      color: "text-muted-foreground/50",
    },
    checking: {
      label: "Checking...",
      color: "text-muted-foreground/30",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className="inline-flex h-8 items-center justify-center gap-2 px-2"
      title={config.label}
    >
      <svg
        className={cn(
          "h-3 w-3 flex-shrink-0",
          config.color,
          status === "checking" && "animate-pulse"
        )}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="8" />
      </svg>
      <span className={cn(
        "text-xs font-medium whitespace-nowrap",
        config.color
      )}>
        {config.label}
      </span>
    </div>
  );
}

