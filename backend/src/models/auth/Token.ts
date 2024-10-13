import mongoose, { Document, Schema } from "mongoose";

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  verificationToken: string;
  passwordResetToken: string;
  createdAt: Date;
  expiresAt: Date;
}

const TokenSchema: Schema<IToken> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verificationToken: {
      type: String,
      default: "",
    },

    passwordResetToken: {
      type: String,
      default: "",
    },

    createdAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true, minimize: true }
);

const Token = mongoose.model<IToken>("Token", TokenSchema);

export default Token;
