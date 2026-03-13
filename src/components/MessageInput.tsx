import { useRef, useState } from "react";

interface MessageInputProps {
  onSend: (text: string, image?: string) => void;
  isDisabled: boolean;
}
function MessageInput({ onSend, isDisabled }: MessageInputProps) {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if ((input.trim() === "" && !imageBase64) || isDisabled) return;
    onSend(input, imageBase64 ?? undefined);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewReader = new FileReader();
    previewReader.onload = () => {
      setImagePreview(previewReader.result as string);
    };
    previewReader.readAsDataURL(file);

    const base64Reader = new FileReader();
    base64Reader.onload = () => {
      const result = base64Reader.result as string;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    base64Reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  return (
    <div className="input-area">
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" />
          <button className="remove-image" onClick={removeImage}>
            &times;
          </button>
        </div>
      )}
      <form className="message-input" onSubmit={handleSubmit}>
        <button
          type="button"
          className="image-upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          title="Upload an image"
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          hidden
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isDisabled ? "Bot is typing..." : "Type a message..."}
          disabled={isDisabled}
        />
        <button type="submit" disabled={isDisabled}>
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
