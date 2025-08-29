import jwt, { JwtPayload } from "jsonwebtoken";
import User from "@/models/user.model";
import { NextFunction, Request, Response } from "express";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Replace `any` with IUser if you have a User interface
    }
  }
}

interface DecodedToken extends JwtPayload {
  userId: string;
}

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized - Token Invalid" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User Not Found" });
    }

    req.user = user;
  return  next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
