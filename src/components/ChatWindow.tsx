import { RefObject } from "react";
import { ChatMessage } from "../types";
import Message from "./Message";

interface ChatWindowProps {
  messages: ChatMessage[];
  bottomRef: RefObject<HTMLDivElement | null>;
  streamingText: string | null;
}

function ChatWindow({ messages, bottomRef, streamingText }: ChatWindowProps) {
  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <Message
          key={index}
          text={msg.text}
          sender={msg.sender}
          timestamp={msg.timestamp}
          skipAnimation={msg.skipAnimation}
          image={msg.image}
        />
      ))}
      {streamingText !== null && (
        <Message text={streamingText} sender="bot" skipAnimation />
      )}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatWindow;
