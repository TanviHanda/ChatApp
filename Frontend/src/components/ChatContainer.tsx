import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

// Define message type (adjust if you already have a global type)
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
}

// Define user type (adjust to match your schema)
interface User {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore() as {
    messages: Message[];
    getMessages: (userId: string) => void;
    isMessagesLoading: boolean;
    selectedUser: User;
    subscribeToMessages: () => void;
    unsubscribeFromMessages: () => void;
    markMessagesAsRead: (senderId: string) => Promise<void>;
  };

  const { authUser } = useAuthStore() as { authUser: User };

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      
      // Mark messages as read when opening chat
      markMessagesAsRead(selectedUser._id);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
              
              {/* Read indicators - only show for sent messages */}
              {message.senderId === authUser._id && (
                <div className="flex items-center justify-end mt-1">
                  {message.isRead ? (
                    <CheckCheck className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Check className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
