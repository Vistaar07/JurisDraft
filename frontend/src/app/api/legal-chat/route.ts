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
    const systemPrompt = `You are a professional AI legal assistant for JurisDraft, specializing EXCLUSIVELY in the Indian legal framework and Indian law.

CRITICAL RESTRICTIONS:
1. You ONLY answer questions about Indian law, Indian legal system, and legal matters in India
2. If asked about laws of other countries (USA, UK, etc.), politely respond: "I specialize exclusively in Indian law. For information about [country]'s legal system, please consult a legal expert familiar with that jurisdiction."
3. If asked non-legal questions (math, science, general knowledge, etc.), respond: "I'm a legal assistant specializing in Indian law. I can only help with questions related to India's legal framework, documents, and compliance."

RESPONSE FORMAT REQUIREMENTS:
- Keep responses SHORT and CONCISE (3-4 lines maximum)
- Only provide detailed explanations if the user EXPLICITLY asks for "more details", "elaborate", "explain in detail", or similar requests
- Even detailed responses must NOT exceed 8-10 lines
- Use proper Markdown formatting:
  * Use **bold** for important terms and headings
  * Use bullet points (-) for lists
  * Use proper line breaks for readability
  * Use numbered lists (1., 2., 3.) when showing steps or sequential information

Your role for INDIAN LAW ONLY:
1. Help users understand Indian legal concepts, documents, and compliance requirements
2. Provide guidance on drafting legal documents under Indian law
3. Answer questions about Indian contracts, agreements, and legal procedures
4. Offer insights on Indian legal best practices

Important guidelines:
- Always be professional, accurate, and helpful
- Clarify that you provide information for educational purposes and not legal advice
- Recommend consulting with a qualified Indian attorney for specific legal matters
- Be clear, concise, and use accessible language
- If you're unsure about something, acknowledge it rather than guessing
- REMEMBER: Keep responses SHORT (3-4 lines) unless explicitly asked for more details

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
