import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

// ---------------- Types ----------------
export interface User {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
}

interface MessageData {
  text: string;
  image?: string;
}

interface ChatState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: MessageData) => Promise<void>;
  markMessagesAsRead: (senderId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (selectedUser: User | null) => void;
}

// ---------------- Store ----------------
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get<User[]>("/messages/users");
      set({ users: res.data });
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch users";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get<Message[]>(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch messages";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: MessageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    set({ isSendingMessage: true });

    // Create optimistic message
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`, // Temporary ID
      senderId: useAuthStore.getState().authUser?._id || "",
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // Add optimistic message immediately
    const messagesWithOptimistic = [...messages, optimisticMessage];
    set({ messages: messagesWithOptimistic });

    try {
      const res = await axiosInstance.post<Message>(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      
      // Replace optimistic message with real message
      const updatedMessages = messagesWithOptimistic.map(msg => 
        msg._id === optimisticMessage._id ? res.data : msg
      );
      
      set({ 
        messages: updatedMessages,
        isSendingMessage: false 
      });
    } catch (error: unknown) {
      // Remove optimistic message on error
      set({ 
        messages: messages, // Revert to original messages
        isSendingMessage: false 
      });
      
      // Show error toast
      let errorMessage = "Something unexpected happened";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
      throw error; // Re-throw for component to handle
    }
  },

  markMessagesAsRead: async (senderId: string) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      
      // Update local messages to mark them as read
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg.senderId === senderId && !msg.isRead 
          ? { ...msg, isRead: true, readAt: new Date().toISOString() }
          : msg
      );
      set({ messages: updatedMessages });
    } catch (error: unknown) {
      console.error("Failed to mark messages as read:", error);
    }
  },

  getUnreadCount: (userId: string) => {
    const { messages } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return 0;
    
    return messages.filter(msg => 
      msg.senderId === userId && 
      msg.receiverId === authUser._id && 
      !msg.isRead
    ).length;
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage: Message) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({ messages: [...get().messages, newMessage] });
      
      // Auto-mark as read if the chat is currently open
      if (selectedUser._id === newMessage.senderId) {
        get().markMessagesAsRead(newMessage.senderId);
      }
    });

    // Handle read receipts
    socket.on("messagesRead", (data: { readBy: string; senderId: string; readAt: string }) => {
      const { messages } = get();
      const authUser = useAuthStore.getState().authUser;
      
      // Only update if the current user is the sender
      if (authUser?._id === data.senderId) {
        const updatedMessages = messages.map(msg => 
          msg.senderId === authUser._id && msg.receiverId === data.readBy && !msg.isRead
            ? { ...msg, isRead: true, readAt: data.readAt }
            : msg
        );
        set({ messages: updatedMessages });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
    socket?.off("messagesRead");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
