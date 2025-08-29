import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { sendMessage, isSendingMessage } = useChatStore() as {
    sendMessage: (payload: { text: string; image?: string }) => Promise<void>;
    isSendingMessage: boolean;
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsLoadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setIsLoadingImage(false);
    };
    reader.onerror = () => {
      toast.error("Failed to load image");
      setIsLoadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setIsLoadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // Store values before clearing form (for optimistic update)
    const messageText = text.trim();
    const messageImage = imagePreview;

    // Clear form immediately for better UX
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      await sendMessage({
        text: messageText,
        image: messageImage || undefined,
      });
    } catch (error) {
      // Restore form state if message failed to send
      setText(messageText);
      setImagePreview(messageImage);
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {(imagePreview || isLoadingImage) && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {isLoadingImage ? (
              <div className="w-20 h-20 rounded-lg border border-zinc-700 flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            ) : (
              <img
                src={imagePreview!}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            )}
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
              disabled={isLoadingImage}
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview || isLoadingImage ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingImage}
          >
            {isLoadingImage ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Image size={20} />
            )}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={(!text.trim() && !imagePreview) || isSendingMessage || isLoadingImage}
        >
          {isSendingMessage ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
