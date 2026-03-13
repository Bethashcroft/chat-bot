import { ChatMessage } from "../types";
import Markdown from "react-markdown";

type MessageProps = Pick<
  ChatMessage,
  "text" | "sender" | "timestamp" | "skipAnimation" | "image"
>;

function Message({
  text,
  sender,
  timestamp,
  skipAnimation,
  image,
}: MessageProps) {
  return (
    <div className={`message ${sender}${skipAnimation ? " no-animate" : ""}`}>
      {image && (
        <img
          className="message-image"
          src={`data:image/jpeg;base64, ${image}`}
          alt="uploaded"
        />
      )}
      {text && <Markdown>{text}</Markdown>}
      {timestamp && <span className="timestamp">{timestamp}</span>}
    </div>
  );
}

export default Message;
