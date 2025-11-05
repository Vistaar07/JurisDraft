import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Build the conversation context with system prompt
    const systemPrompt = `You are a professional AI legal assistant for JurisDraft, an AI-powered legal document generation platform. Your role is to:

1. Help users understand legal concepts, documents, and compliance requirements
2. Provide guidance on drafting legal documents
3. Answer questions about contracts, agreements, and legal procedures
4. Offer insights on legal best practices

Important guidelines:
- Always be professional, accurate, and helpful
- Clarify that you provide information for educational purposes and not legal advice
- Recommend consulting with a qualified attorney for specific legal matters
- Be clear, concise, and use accessible language
- If you're unsure about something, acknowledge it rather than guessing

Current user question: ${message}`;

    // If there's conversation history, include it for context
    let fullPrompt = systemPrompt;
    if (
      conversationHistory &&
      Array.isArray(conversationHistory) &&
      conversationHistory.length > 0
    ) {
      const historyText = conversationHistory
        .slice(-5) // Keep last 5 messages for context
        .map(
          (msg: { role: string; content: string }) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");

      fullPrompt = `Previous conversation:\n${historyText}\n\n${systemPrompt}`;
    }

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      message: text,
      success: true,
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    // Handle specific error cases
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid API key configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate response. Please try again.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
