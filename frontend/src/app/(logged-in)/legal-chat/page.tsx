"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ui/shadcn-io/ai/message";
import {
  Suggestions,
  Suggestion,
} from "@/components/ui/shadcn-io/ai/suggestion";
import { Scale, Sparkles, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_QUESTIONS = [
  "What is Section 420 of IPC?",
  "Explain the Indian Contract Act 1872",
  "What is a power of attorney in India?",
  "Tell me about GST compliance requirements",
  "What are consumer rights under Indian law?",
];

export default function LegalChatPage() {
  const { user } = useUser();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "**Namaste!** 🙏 I'm your AI legal assistant specializing in **Indian law**. I can help you with legal questions about Indian documents, contracts, and compliance. How can I assist you today?",
    },
  ]);
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">(
    "ready"
  );
  const [isThinking, setIsThinking] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setStatus("streaming");
    setIsThinking(true);

    try {
      // Call the Gemini API
      const response = await fetch("/api/legal-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("ready");
      setIsThinking(false);
    } catch (error) {
      console.error("Error in chat:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please make sure the Gemini API key is configured correctly and try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setStatus("ready");
      setIsThinking(false);
    }
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
              Ask questions about Indian legal documents, contracts, and
              compliance. Get instant AI-powered guidance for Indian law.
            </p>
          </div>
        </MotionDiv>

        {/* Chat Container */}
        <MotionDiv
          variants={itemsVariants}
          className="flex-1 flex flex-col bg-white rounded-2xl border border-rose-200 shadow-lg overflow-hidden max-h-[600px]"
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <Conversation className="h-full">
              <ConversationContent className="space-y-4">
                {messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    {message.role === "assistant" && (
                      <MessageAvatar
                        src="/api/placeholder/32/32"
                        name="AI"
                        className="bg-rose-100"
                      >
                        <Bot className="h-4 w-4 text-rose-600" />
                      </MessageAvatar>
                    )}
                    <MessageContent>
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0 leading-relaxed">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-gray-900">
                                {children}
                              </strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside space-y-1 my-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside space-y-1 my-2">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="ml-2">{children}</li>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold mb-2 mt-1">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold mb-2 mt-1">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold mb-1 mt-1">
                                {children}
                              </h3>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </MessageContent>
                    {message.role === "user" && (
                      <MessageAvatar
                        src={user?.imageUrl || "/api/placeholder/32/32"}
                        name={user?.firstName || user?.username || "You"}
                        className="bg-gray-100"
                      />
                    )}
                  </Message>
                ))}

                {/* Reasoning Indicator */}
                {isThinking && (
                  <div className="flex items-start gap-3">
                    <MessageAvatar
                      src="/api/placeholder/32/32"
                      name="AI"
                      className="bg-rose-100"
                    >
                      <Bot className="h-4 w-4 text-rose-600 animate-pulse" />
                    </MessageAvatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-[75%]">
                      <div className="text-sm text-gray-600 animate-pulse">
                        Analyzing your question about Indian law...
                      </div>
                    </div>
                  </div>
                )}
              </ConversationContent>
            </Conversation>
          </div>

          {/* Input Area */}
          <div className="border-t border-rose-100 p-4 bg-rose-50/30 space-y-3">
            {/* Suggestion Chips */}
            {messages.length === 1 && (
              <Suggestions className="flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((question, index) => (
                  <Suggestion
                    key={index}
                    suggestion={question}
                    onClick={handleSuggestionClick}
                    className="bg-white hover:bg-rose-50 border-rose-200 text-gray-700 hover:text-rose-700 text-sm"
                  >
                    {question}
                  </Suggestion>
                ))}
              </Suggestions>
            )}

            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                ref={inputRef}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(e.currentTarget.value)
                }
                placeholder="Ask me anything about Indian law, legal documents, contracts, or compliance..."
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
            AI responses are for informational purposes only and do not
            constitute legal advice
          </p>
        </MotionDiv>
      </MotionDiv>
    </section>
  );
}
