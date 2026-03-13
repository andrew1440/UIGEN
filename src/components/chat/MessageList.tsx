"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

// Helper function to generate user-friendly tool messages
function getToolMessage(toolName: string, toolArgs?: Record<string, any>): string {
  if (toolName === "str_replace_editor") {
    if (!toolArgs) return "Editing file...";
    
    const action = toolArgs.command;
    const path = toolArgs.path || toolArgs.file_path;
    const fileName = path ? path.split("/").pop() : "file";
    
    if (action === "create") {
      return `Creating ${fileName}`;
    } else if (action === "str_replace") {
      return `Editing ${fileName}`;
    } else if (action === "delete") {
      return `Deleting ${fileName}`;
    }
    return `Modifying ${fileName}`;
  } else if (toolName === "file_manager") {
    if (!toolArgs) return "Managing files...";
    
    const action = toolArgs.action;
    const path = toolArgs.path || toolArgs.file_path;
    const fileName = path ? path.split("/").pop() : "file";
    
    switch (action) {
      case "list":
        return `Listing files in ${fileName}`;
      case "create":
        return `Creating ${fileName}`;
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Managing ${fileName}`;
    }
  }
  
  return toolName;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-4 text-center py-12">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4 shadow-sm">
          <Bot className="h-7 w-7 text-blue-600" />
        </div>
        <p className="text-neutral-900 font-semibold text-lg mb-2">Start a conversation to generate React components</p>
        <p className="text-neutral-500 text-sm max-w-sm">I can help you create buttons, forms, cards, and more</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-4",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                  <Bot className="h-4.5 w-4.5 text-neutral-700" />
                </div>
              </div>
            )}
            
            <div className={cn(
              "flex flex-col gap-2 max-w-[85%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-xl px-4 py-3",
                message.role === "user" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-white text-neutral-900 border border-neutral-200 shadow-sm"
              )}>
                <div className="text-sm">
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 bg-white/50 rounded-md border border-neutral-200">
                                <span className="text-xs font-medium text-neutral-600 block mb-1">Reasoning</span>
                                <span className="text-sm text-neutral-700">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            const tool = part.toolInvocation;
                            const userFriendlyMessage = getToolMessage(tool.toolName, tool.args);
                            return (
                              <div key={partIndex} className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-medium border border-neutral-200">
                                {tool.state === "result" && tool.result ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-neutral-700">{userFriendlyMessage}</span>
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                    <span className="text-neutral-700">{userFriendlyMessage}</span>
                                  </>
                                )}
                              </div>
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-500">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-neutral-200" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <div className="flex items-center gap-2 mt-3 text-neutral-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <MarkdownRenderer content={message.content} className="prose-sm" />
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 shadow-sm flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}