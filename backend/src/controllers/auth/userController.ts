import asyncHandler from "express-async-handler";
import User from "../../models/auth/UserModel";
import generateToken from "../../helpers/generateToken";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Token from "../../models/auth/Token";
import crypto from "node:crypto";
import hashToken from "../../helpers/hashToken";
import sendEmail from "../../helpers/sendEmail";
import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../middleware/authMiddleware";

type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export const registerUser: RequestHandler = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.",
      });
      return;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        message: "Invalid email format. Please use the format: user@domain.com",
      });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: false,
    });

    if (user) {
      const { _id, name, email, role, photo, bio, isVerified } = user;

      res.status(201).json({
        _id,
        name,
        email,
        role,
        photo,
        bio,
        isVerified,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};

export const loginUser: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.",
    });
    return;
  }

  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      message: "Invalid email format. Please use the format: user@domain.com",
    });
    return;
  }

  const userExists = await User.findOne({ email });

  if (!userExists) {
    res.status(404).json({ message: "User not found, sign up!" });
    return;
  }

  const isMatch = await bcrypt.compare(password, userExists.password);

  if (!isMatch) {
    res.status(400).json({ message: "Invalid credentials" });
    return;
  }

  const token = generateToken(userExists._id);

  if (userExists && isMatch) {
    const { _id, name, email, role, photo, bio, isVerified } = userExists;

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  } else {
    res.status(400).json({ message: "Invalid email or password" });
  }
};

export const logoutUser: RequestHandler = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
  });

  res.status(200).json({ message: "User logged out" });
};

export const getUser: RequestHandler = async (
  req: CustomRequest,
  res: Response
) => {
  const user = await User.findById(req.user?._id).select("-password");

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

export const userLoginStatus: RequestHandler = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ message: "Not authorized, please login!" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (decoded) {
      res.status(200).json(true);
    } else {
      res.status(401).json(false);
    }
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const verifyEmail: RequestHandler = async (
  req: CustomRequest,
  res: Response
) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  if (user.isVerified) {
    res.status(400).json({ message: "User is already verified" });
    return;
  }

  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }

  const verificationToken = crypto.randomBytes(64).toString("hex") + user._id;

  const hashedToken = hashToken(verificationToken);

  await new Token({
    userId: user._id,
    verificationToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  }).save();

  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  if (!process.env.USER_EMAIL) {
    res.status(500).json({ message: "Sender email is not configured" });
    return;
  }
  const sendEmailOptions = {
    subject: "Email Verification",
    send_to: user.email,
    send_from: process.env.USER_EMAIL,
    reply_to: "noreply@gmail.com",
    template: "emailVerification.ejs",
    data: {
      name: user.name,
      link: verificationLink,
      subject: "Email Verfication",
    },
  };

  try {
    await sendEmail(sendEmailOptions);
    res.json({ message: "Email sent" });
    return;
  } catch (error) {
    console.log("Error sending email: ", error);
    res.status(500).json({ message: "Email could not be sent" });
    return;
  }
};

export const verifyUser: RequestHandler = async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    res.status(400).json({ message: "Invalid verification token" });
    return;
  }
  const hashedToken = hashToken(verificationToken);

  const userToken = await Token.findOne({
    verificationToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(400).json({ message: "Invalid or expired verification token" });
    return;
  }
  const user = await User.findById(userToken.userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ message: "User is already verified" });
    return;
  }

  user.isVerified = true;
  await user.save();
  res.status(200).json({ message: "User verified" });
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      message: "Invalid email format. Please use the format: user@domain.com",
    });
    return;
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  let token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }

  const passwordResetToken = crypto.randomBytes(64).toString("hex") + user._id;

  const hashedToken = hashToken(passwordResetToken);

  await new Token({
    userId: user._id,
    passwordResetToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000,
  }).save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${passwordResetToken}`;

  if (!process.env.USER_EMAIL) {
    res.status(500).json({ message: "Sender email is not configured" });
    return;
  }

  const sendEmailOptions = {
    subject: "Password Reset",
    send_to: user.email,
    send_from: process.env.USER_EMAIL,
    reply_to: "noreply@gmail.com",
    template: "forgotPassword.ejs",
    data: {
      subject: "Password Reset",
      name: user.name,
      link: resetLink,
    },
  };

  try {
    await sendEmail(sendEmailOptions);
    res.json({ message: "Email sent" });
  } catch (error) {
    console.log("Error sending email: ", error);
    res.status(500).json({ message: "Email could not be sent" });
    return;
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ message: "Password is required" });
    return;
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.",
    });
    return;
  }

  const hashedToken = hashToken(resetPasswordToken);

  const userToken = await Token.findOne({
    passwordResetToken: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(400).json({ message: "Invalid or expired reset token" });
    return;
  }

  const user = await User.findById(userToken.userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.password = password;
  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
};
