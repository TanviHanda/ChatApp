import { env } from "@/utils/env";
import express from "express";
import authRoutes from "./routes/auth.route";
import messageRoutes from "./routes/message.route";
import 'dotenv/config'; 
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db";
import { server, app } from "./lib/socket";
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoutes)
const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
export default app;
