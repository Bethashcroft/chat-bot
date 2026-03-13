import { Conversation } from "../types";

interface ChatHistoryProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function ChatHistory({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
}: ChatHistoryProps) {
  return (
    <div className={`chat-history ${isOpen ? "open" : ""}`}>
      <div className="history-header">
        <h2>Chat History</h2>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <button className="new-chat-button" onClick={onNew}>
        New Chat
      </button>
      <div className="history-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`history-item ${conv.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="history-item-content">
              <span className="history-title">{conv.title}</span>
              <span className="history-date">{conv.createdAt}</span>
            </div>
            <button
              className="history-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatHistory;
