import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatWithGemini } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { message, conversationId, billId } = await request.json();
    const user = await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let currentConvId = conversationId;

    if (!currentConvId) {
      const newConv = await prisma.conversation.create({
        data: {
          title: message.substring(0, 30) + "...",
          userId: user.id,
        },
      });
      currentConvId = newConv.id;
    }

    // Get previous messages
    const pastMessages = await prisma.message.findMany({
      where: { conversationId: currentConvId },
      orderBy: { timestamp: "asc" },
    });

    const conversationHistory = pastMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Save user message to DB
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        conversationId: currentConvId,
      },
    });

    // Call Gemini
    const geminiResponse = await chatWithGemini({
      userId: user.id,
      userMessage: message,
      conversationHistory,
      explicitBillId: billId || undefined,
    });

    // Save assistant response to DB
    const assistantMsg = await prisma.message.create({
      data: {
        role: "assistant",
        content: geminiResponse.content,
        structuredResponse: geminiResponse.structuredResponse ? JSON.stringify(geminiResponse.structuredResponse) : null,
        contextMeta: JSON.stringify(geminiResponse.contextMeta),
        conversationId: currentConvId,
      },
    });

    return NextResponse.json({
      conversationId: currentConvId,
      message: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        structuredResponse: geminiResponse.structuredResponse,
        contextMeta: geminiResponse.contextMeta,
        timestamp: assistantMsg.timestamp,
      },
      title: !conversationId ? (message.substring(0, 30) + "...") : undefined,
    });

  } catch (error) {
    console.error("Error in assistant API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
