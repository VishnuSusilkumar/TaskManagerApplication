"use client";
import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { useUserContext } from "./userContext";
import { useSocket } from "@/utils/socket";
import toast from "react-hot-toast";

const NotificationContext = createContext();
const serverUrl = "https://taskmanager-3kcf.onrender.com/api/v1";

export const NotificationProvider = ({ children }) => {
  const { user } = useUserContext();
  const userId = user?._id;
  const socket = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${serverUrl}/notifications/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.log("Error fetching notifications", error);
      toast.error("Failed to fetch notifications.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!socket) {
      console.error("Socket connection is null or not initialized!");
      return;
    }

    socket.on("taskCreated", (newTask) => {
      const notification = {
        message: `New task added: ${newTask.title}`,
        task: newTask,
        status: "unread",
      };
      setNotifications((prev) => [...prev, notification]);
    });

    socket.on("taskUpdated", (updatedTask) => {
      console.log("Task updated", updatedTask);
      
      const notification = {
        message: `Task updated: ${updatedTask.title}`,
        task: updatedTask,
        status: "unread",
      };
      setNotifications((prev) => [...prev, notification]);
    });

    socket.on("taskDeleted", (deletedTask) => {
      console.log("Deleted Task", deletedTask);
      
      const notification = {
        message: `Task deleted: ${deletedTask.title}`,
        status: "unread",
      };
      setNotifications((prev) => [...prev, notification]);
    });

    return () => {
      socket.off("taskCreated");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, [socket]);

  const createNotification = async (notification) => {
    try {
      await axios.post(`${serverUrl}/create-notification`, {
        message: notification.message,
      });
      await fetchNotifications();
    } catch (error) {
      console.log("Error creating notification", error);
      toast.error("Failed to create notification.");
    }
  };

  const updateNotificationStatus = async (notificationId, status) => {
    try {
      await axios.patch(`${serverUrl}/update-notification/${notificationId}`, {
        status,
      });
    } catch (error) {
      console.log("Error updating notification status", error);
      toast.error("Failed to update notification status.");
    }
  };

  const markAsRead = async (notificationId) => {
    const notificationToUpdate = notifications.find(
      (notification) => notification._id === notificationId
    );
  
    if (!notificationToUpdate) {
      console.error("Notification not found with ID:", notificationId);
    }
  
    setNotifications((prev) => {
      return prev.map((notification) =>
        notification._id === notificationId
          ? { ...notification, status: "read" }
          : notification
      );
    });
  
    try {
      await updateNotificationStatus(notificationId, "read");
    } catch (error) {
      console.log("Error updating notification status", error);
      toast.error("Failed to update notification status.");
    }
  };
  
  

  const markAllAsRead = async () => {
    setNotifications([]);

    const updatePromises = notifications.map((notification) => {
      if (notification._id) {
        return updateNotificationStatus(notification._id, "read");
      } else {
        console.error("Notification missing ID:", notification);
        return Promise.resolve(); 
      }
    });

    await Promise.all(updatePromises).catch((error) => {
      console.log("Error updating notification statuses", error);
      toast.error("Failed to update all notification statuses.");
    });

    await fetchNotifications(); 
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        createNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  return React.useContext(NotificationContext);
};
