import asyncHandler from "express-async-handler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/auth/UserModel";

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

export interface CustomRequest extends Request {
  user?: IUser;
}

export const protect = asyncHandler(
  async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.cookies.token;

      if (!token) {
        res.status(401).json({ message: "Not authorized, please login!" });
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as CustomJwtPayload;

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(404).json({ message: "User not found!" });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed!" });
    }
  }
);

