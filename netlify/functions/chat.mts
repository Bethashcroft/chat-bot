// Server-side proxy for the Gemini API.
//
// The API key lives here and never reaches the browser. The browser POSTs its
// conversation history to /api/chat, and we stream Gemini's SSE response
// straight back so the client can keep reading it chunk by chunk.

const MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT =
  "You are a friendly and helpful chat bot. Keep responses concise — 1 to 3 sentences. When the user sends an image, describe or answer questions about it.";

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleChatRequest(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return errorResponse("Server is not configured with GEMINI_API_KEY", 500);
  }

  let conversationHistory: ConversationEntry[];

  try {
    const payload = await request.json();
    conversationHistory = payload?.conversationHistory;
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  if (!Array.isArray(conversationHistory)) {
    return errorResponse("Expected a conversationHistory array", 400);
  }

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

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
      }),
    },
  );

  if (!upstream.ok || !upstream.body) {
    // Deliberately vague: upstream errors can echo the key back in the body.
    return errorResponse(`Gemini API error: ${upstream.status}`, 502);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

// Netlify serves this function at /api/chat rather than the default
// /.netlify/functions/chat path.
export const config = {
  path: "/api/chat",
};

export default handleChatRequest;
