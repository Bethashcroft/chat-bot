import { ConversationEntry } from "./types";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function getAIResponse(
  conversationHistory: ConversationEntry[],
): Promise<ReadableStream<Uint8Array>> {
  const contents = conversationHistory.map((msg) => {
    const parts: Record<string, unknown>[] = [];

    if (msg.image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: msg.image,
        },
      });
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [
            {
              text: "You are a friendly and helpful chat bot. Keep responses concise — 1 to 3 sentences. When the user sends an image, describe or answer questions about it.",
            },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body received");
  }

  return response.body;
}
