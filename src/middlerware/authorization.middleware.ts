import { Request, Response, NextFunction } from "express";
import { IUser } from "../types/user.types";
import { CONSTANTS } from "../config/constant";
import UserModel from "../models/user.model";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userTemp = req.user as IUser;
    const user = await UserModel.findById(userTemp._id);

    if (!user) {
      res.status(CONSTANTS.STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Unauthorized: User not found" });
      return
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(CONSTANTS.STATUS_CODES.FORBIDDEN).json({ success: false, message: "Forbidden: Access denied" });
      return
    }

    next();
  };
};
