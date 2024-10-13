import express, { Router } from "express";
import {
  forgotPassword,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  userLoginStatus,
  verifyEmail,
  verifyUser,
} from "../controllers/auth/userController";
import { protect } from "../middleware/authMiddleware";

const userRouter: Router = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);
userRouter.get("/user", protect, getUser);
userRouter.get("/login-status", userLoginStatus);
userRouter.post("/verify-email", protect, verifyEmail);
userRouter.post("/verify-user/:verificationToken", verifyUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password/:resetPasswordToken", resetPassword);

export default userRouter;
