export interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  timestamp?: string;
  skipAnimation?: boolean;
  image?: string;
}

export interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}
