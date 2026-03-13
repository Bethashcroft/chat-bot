import { useState, useEffect, useRef } from "react";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import ChatHistory from "./components/ChatHistory";
import { getAIResponse } from "./api";
import { ChatMessage, Conversation } from "./types";
import "./App.css";
import WelcomeModal from "./components/WelcomeModal";

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [
      {
        text: "Hi! I'm a chat bot powered by AI. How can I help you?",
        sender: "bot",
        timestamp: formatTime(new Date()),
      },
    ],
    createdAt: new Date().toLocaleDateString(),
  };
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("chat-conversations");
    if (saved) {
      const loaded: Conversation[] = JSON.parse(saved);
      return loaded.map((conv) => ({
        ...conv,
        messages: conv.messages.map((msg) => ({ ...msg, skipAnimation: true })),
      }));
    }
    return [createConversation()];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const savedId = localStorage.getItem("active-conversation-id");
    const saved = localStorage.getItem("chat-conversations");

    if (savedId && saved) {
      const loaded: Conversation[] = JSON.parse(saved);
      if (loaded.some((c) => c.id === savedId)) return savedId;
    }

    if (saved) {
      const loaded: Conversation[] = JSON.parse(saved);
      return loaded[0]?.id ?? createConversation().id;
    }
    return conversations[0].id;
  });

  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("dark-mode") === "true";
  });
  const [streamingText, setStreamingText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showWelcome, setshowWelcome] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isFirstRender = useRef(true);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = activeConv?.messages ?? [];

  const setMessages = (
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConvId) return conv;
        const newMessages =
          typeof updater === "function" ? updater(conv.messages) : updater;
        const title =
          conv.title === "New Chat" && newMessages.length > 1
            ? newMessages.find((m) => m.sender === "user")?.text.slice(0, 30) ||
              conv.title
            : conv.title;
        return { ...conv, messages: newMessages, title };
      }),
    );
  };

  useEffect(() => {
    if (isFirstRender.current) {
      bottomRef.current?.scrollIntoView();
      isFirstRender.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, displayedText]);

  useEffect(() => {
    localStorage.setItem("chat-messages", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("dark-mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("active-conversation-id", activeConvId);
  }, [activeConvId]);

  useEffect(() => {
    localStorage.setItem("chat-conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender !== "user") return;

    let cancelled = false;

    async function fetchReply() {
      setIsTyping(true);
      setStreamingText("");
      setDisplayedText("");

      const conversationHistory = messages.map((msg) => ({
        role:
          msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.text,
        image: msg.image,
      }));

      try {
        const stream = await getAIResponse(conversationHistory);
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        setIsTyping(false);
        setIsStreaming(true);

        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6);
            if (jsonStr.trim() === "") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                if (!cancelled) setStreamingText(fullText);
              }
            } catch {
              // A failed parse on one chunk is harmless
              // the next chunk will contain the full data
            }
          }
        }
      } catch (error) {
        console.error("API Error:", error);
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          setIsTyping(false);
          setIsStreaming(false);
          setMessages((prev) => [
            ...prev,
            {
              text: `Error: ${message}`,
              sender: "bot",
              timestamp: formatTime(new Date()),
            },
          ]);
        }
      }
    }

    fetchReply();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  useEffect(() => {
    if (!isStreaming || displayedText.length >= streamingText.length) {
      if (isStreaming && streamingText && displayedText === streamingText) {
        setMessages((prev) => [
          ...prev,
          {
            text: streamingText,
            sender: "bot",
            timestamp: formatTime(new Date()),
            skipAnimation: true,
          },
        ]);
        setIsStreaming(false);
        setStreamingText("");
        setDisplayedText("");
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(streamingText.slice(0, displayedText.length + 1));
    }, 12);

    return () => clearTimeout(timer);
  }, [displayedText, streamingText, isStreaming]);

  const handleSend = (text: string, image?: string) => {
    setMessages((prev) => [
      ...prev,
      { text, sender: "user", timestamp: formatTime(new Date()), image },
    ]);
  };

  const handleClear = () => {
    setMessages([
      {
        text: "Hi! I'm a chat bot powered by AI. How can I help you?",
        sender: "bot",
        timestamp: formatTime(new Date()),
      },
    ]);
  };

  const handleNewChat = () => {
    const newConv = createConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setShowHistory(false);
    isFirstRender.current = true;
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setShowHistory(false);
    isFirstRender.current = true;
  };

  const handleDeleteConv = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const newConv = createConversation();
        setActiveConvId(newConv.id);
        return [newConv];
      }

      if (id === activeConvId) {
        setActiveConvId(remaining[0].id);
      }
      return remaining;
    });
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <header className="app-header">
        <div className="header-left">
          <button
            className="history-toggle"
            onClick={() => setShowHistory((prev) => !prev)}
            title="Chat History"
          >
            ☰
          </button>
        </div>
        <h1>Chat Bot</h1>
        <div className="header-actions">
          {messages.length > 1 && (
            <button className="clear-button" onClick={handleClear}>
              Clear Chat
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          <button
            className="help-button"
            onClick={() => setshowWelcome(true)}
            title="Help"
          >
            ?
          </button>
        </div>
      </header>
      <ChatHistory
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
        onDelete={handleDeleteConv}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      <ChatWindow
        messages={messages}
        bottomRef={bottomRef}
        streamingText={isStreaming ? displayedText : null}
      />
      {isTyping && <div className="typing-indicator">Bot is typing...</div>}
      <MessageInput onSend={handleSend} isDisabled={isTyping || isStreaming} />
      <div className="disclaimer">
        Powered by Gemini 2.5 Flash Lite. AI can make mistakes - please
        fact-check responses.
      </div>
      {showWelcome && <WelcomeModal onClose={() => setshowWelcome(false)} />}
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default App;
