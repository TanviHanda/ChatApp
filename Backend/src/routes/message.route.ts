import { getMessages, getUsersForSidebar, sendMessage, markMessagesAsRead } from "@/controllers/message.controller.js";
import { protectRoute } from "@/middleware/auth.middleware.js";
import express from "express"
const router = express.Router();

router.get("/users",protectRoute,getUsersForSidebar)
router.get("/:id",protectRoute,getMessages)
router.post("/send/:id",protectRoute,sendMessage)
router.put("/read/:id",protectRoute,markMessagesAsRead)
export default router;