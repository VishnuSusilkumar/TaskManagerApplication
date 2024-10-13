import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  message: string;
  status: "unread" | "read";
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  message: { type: String, required: true },
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  createdAt: { type: Date, default: Date.now },
});

const NotificationModel = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

export default NotificationModel;
