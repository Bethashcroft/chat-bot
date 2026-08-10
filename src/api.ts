import { ConversationEntry } from "./types";

export async function getAIResponse(
  conversationHistory: ConversationEntry[],
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationHistory }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body received");
  }

  return response.body;
}
