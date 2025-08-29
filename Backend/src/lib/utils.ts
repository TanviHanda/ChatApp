import jwt from "jsonwebtoken";
import { Response } from "express";
interface TokenPayload {
    userId: string | number;
}

export const generateToken = (userId: string | number, res: Response): string => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not defined");
    }

    const payload: TokenPayload = { userId };
    const token = jwt.sign(payload, jwtSecret, { 
        expiresIn: '7d',
        algorithm: 'HS256' // Explicitly specify the algorithm
    });

    // Set secure cookie with enhanced security options
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
         secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
        path: '/',
        // partitioned: true, // For Chrome's new cookie partitioning
    };

    res.cookie('jwt', token, cookieOptions);
    return token;
};

export const clearToken = (res: Response): void => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
};