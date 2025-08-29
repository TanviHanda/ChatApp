import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { Request, Response } from "express";

// Extend Express Request to include user (from auth middleware)
declare global {
  namespace Express {
    interface Request {
      user?: any; // replace `any` with IUser if you have a user interface
    }
  }
}

export const getUsersForSidebar = async (req: Request, res: Response): Promise<void> => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", (error as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", (error as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req: Request, res: Response)=> {
  try {
    const { text, image } = req.body as { text: string; image?: string };
    const { id: receiverId } = req.params;
    if(!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }
    const senderId = req.user._id;

    let imageUrl: string | undefined;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

   return res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", (error as Error).message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
