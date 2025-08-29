import jwt from "jsonwebtoken";
import { Response } from "express";
export const generateToken = (userId: Number|String, res: Response) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || typeof jwtSecret !== "string") {
        throw new Error("JWT_SECRET environment variable is not defined");
    }
    const token = jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV !== "development",
    });
    return token;
}