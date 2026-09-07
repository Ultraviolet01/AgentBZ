import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check cookies first, then Authorization header
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  
  if (!token) {
    return res.status(401).json({ 
      error: "Access denied. No token provided.",
      code: "NO_TOKEN" 
    });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        error: "Session expired", 
        code: "TOKEN_EXPIRED" 
      });
    }
    res.status(401).json({ error: "Invalid session", code: "INVALID_TOKEN" });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies?.accessToken || req.cookies?.auth_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId?: string; id?: string };
      (req as any).userId = decoded.userId || decoded.id;
    } catch {}
  }

  next();
};
