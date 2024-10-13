import express, {Router} from "express";
import {
  createNotification,
  getNotifications,
  updateNotificationStatus,
} from "../controllers/notification/notificationController";
import { protect } from "../middleware/authMiddleware";

const notificationRouter: Router = express.Router();

notificationRouter.post("/create-notification", protect, createNotification);
notificationRouter.get("/notifications/:id", protect, getNotifications);
notificationRouter.patch("/update-notification/:id", protect, updateNotificationStatus);

export default notificationRouter;
