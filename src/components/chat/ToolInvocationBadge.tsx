"use client";

import { Loader2 } from "lucide-react";
import { getToolMessage } from "@/lib/tools/format-tool-message";

interface ToolInvocationBadgeProps {
  toolName: string;
  toolArgs?: Record<string, any>;
  state: "call" | "result" | "error";
  result?: any;
  error?: any;
}

/**
 * Displays a formatted tool invocation badge with status indicator
 * Shows user-friendly messages for file operations (create, edit, delete)
 */
export function ToolInvocationBadge({
  toolName,
  toolArgs,
  state,
  result,
  error,
}: ToolInvocationBadgeProps) {
  const message = getToolMessage(toolName, toolArgs);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-medium border border-neutral-200">
      {state === "result" && result ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : state === "error" ? (
        <>
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
