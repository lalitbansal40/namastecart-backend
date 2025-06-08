// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONSTANTS } from "../config/constant";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(CONSTANTS.STATUS_CODES.FORBIDDEN).json({ success: false, message: "Authorization token missing or invalid" });
    return
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, CONSTANTS.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Auth Error:", err);
    res.status(CONSTANTS.STATUS_CODES.FORBIDDEN).json({ success: false, message: "Invalid or expired token" });
    return
  }
};
