"use client";

import { useState } from "react";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants, itemsVariants } from "@/utils/constants";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import {
  Conversation,
  ConversationContent,
} from "@/components/ui/shadcn-io/ai/conversation";
import { Message, MessageContent, MessageAvatar } from "@/components/ui/shadcn-io/ai/message";
import { Scale, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function LegalChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI legal assistant. I can help you with legal questions, document drafting guidance, and compliance information. How can I assist you today?",
    },
  ]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setStatus("streaming");

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm processing your legal query. In a production environment, this would connect to your backend API to provide detailed legal assistance based on your document corpus and AI models.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("ready");
    }, 1000);
  };

  return (
    <section className="min-h-screen flex flex-col">
      <BgGradient className="from-rose-500 via-red-500 to-pink-500 opacity-20" />
      
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-7xl px-6 py-8 flex-1 flex flex-col"
      >
        {/* Header */}
        <MotionDiv variants={itemsVariants} className="mb-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {/* Badge */}
            <div className="relative p-[3px] overflow-hidden rounded-full bg-linear-to-r from-rose-200 via-rose-500 to-rose-800 animate-gradient-x group">
              <Badge
                variant="secondary"
                className="relative px-6 py-2 text-base font-medium bg-white rounded-full group-hover:bg-gray-50 transition-colors duration-200"
              >
                <Sparkles className="size-5 text-rose-600 animate-pulse" />
                <p className="text-base text-rose-600 font-semibold">
                  AI Legal Assistant
                </p>
              </Badge>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-rose-600" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Legal Chat
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 max-w-2xl">
              Ask questions about legal documents, contracts, and compliance. Get instant AI-powered guidance.
            </p>
          </div>
        </MotionDiv>

        {/* Chat Container */}
        <MotionDiv
          variants={itemsVariants}
          className="flex-1 flex flex-col bg-white rounded-2xl border border-rose-200 shadow-lg overflow-hidden"
        >
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent className="space-y-4">
                {messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    {message.role === "assistant" && (
                      <MessageAvatar
                        src="/api/placeholder/32/32"
                        name="AI"
                        className="bg-rose-100"
                      />
                    )}
                    <MessageContent>{message.content}</MessageContent>
                    {message.role === "user" && (
                      <MessageAvatar
                        src="/api/placeholder/32/32"
                        name="You"
                        className="bg-gray-100"
                      />
                    )}
                  </Message>
                ))}
              </ConversationContent>
            </Conversation>
          </div>

          {/* Input Area */}
          <div className="border-t border-rose-100 p-4 bg-rose-50/30">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask me anything about legal documents, contracts, or compliance..."
                className="bg-white"
              />
              <PromptInputToolbar>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
                <PromptInputSubmit 
                  disabled={!input.trim()} 
                  status={status}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </MotionDiv>

        {/* Footer Info */}
        <MotionDiv
          variants={itemsVariants}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p className="flex items-center justify-center gap-2">
            <Scale className="h-4 w-4 text-rose-600" />
            AI responses are for informational purposes only and do not constitute legal advice
          </p>
        </MotionDiv>
      </MotionDiv>
    </section>
  );
}
