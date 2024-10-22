import { Request, Response, NextFunction } from "express";
import NotificationModel from "../../models/notification/NotificationModel";
import { CustomRequest } from "../../middleware/authMiddleware";
import { StatusCode } from "../../helpers/enums";

export const createNotification = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message } = req.body;

    const notification = new NotificationModel({
      user: req.user?._id,
      message,
    });

    await notification.save();

    res.status(StatusCode.Created).json(notification);
  } catch (error: any) {
    console.log("Error in createNotification: ", error.message);
    res.status(StatusCode.InternalServerError).json({ message: error.message });
  }
};

export const getNotifications = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;

    const notifications = await NotificationModel.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(StatusCode.OK).json(notifications);
  } catch (error: any) {
    console.log("Error in getNotifications: ", error.message);
    res.status(StatusCode.InternalServerError).json({ message: error.message });
  }
};

export const updateNotificationStatus = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!notification) {
      res.status(StatusCode.NotFound).json({ message: "Notification not found!" });
      return;
    }

    res.status(StatusCode.OK).json(notification);
  } catch (error: any) {
    console.log("Error in updateNotificationStatus: ", error.message);
    res.status(StatusCode.InternalServerError).json({ message: error.message });
  }
};
