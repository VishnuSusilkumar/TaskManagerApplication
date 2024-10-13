import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../middleware/authMiddleware";
import TaskModel from "../../models/tasks/TaskModel";
import { io } from "../../server";
import mongoose from "mongoose";

export const createTask = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, dueDate, priority, status } = req.body;

    if (!req.user?.isVerified) {
      res.status(403).json({ message: "User is not verified!" });
      return;
    }

    if (!title || title.trim() === "") {
      res.status(400).json({ message: "Title is required!" });
      return;
    }

    if (!description || description.trim() === "") {
      res.status(400).json({ message: "Description is required!" });
      return;
    }

    const existingTask = await TaskModel.findOne({
      user: req.user._id,
      title,
    });

    if (existingTask) {
      res
        .status(400)
        .json({ message: "A task with this title already exists!" });
      return;
    }

    const task = new TaskModel({
      title,
      description,
      dueDate,
      priority,
      status,
      user: req.user?._id,
    });

    await task.save();
    io.emit("taskCreated", task);

    res.status(201).json(task);
  } catch (error: any) {
    console.log("Error in createTask: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(400).json({ message: "User not found!" });
    }

    const tasks = await TaskModel.find({ user: userId });

    res.status(200).json({
      length: tasks.length,
      tasks,
    });
  } catch (error: any) {
    console.log("Error in getTasks: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getTask = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "Please provide a task id" });
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found!" });
      return;
    }

    if (!task.user.equals(userId)) {
      res.status(401).json({ message: "Not authorized!" });
    }

    res.status(200).json(task);
  } catch (error: any) {
    console.log("Error in getTask: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    const { id } = req.params;
    const { title, description, dueDate, priority, status, completed } =
      req.body;

    if (!req.user?.isVerified) {
      res.status(403).json({ message: "User is not verified!" });
      return;
    }

    if (!id) {
      res.status(400).json({ message: "Please provide a task id" });
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found!" });
      return;
    }

    if (!task.user.equals(userId)) {
      res.status(401).json({ message: "Not authorized!" });
      return;
    }

    const existingTask = await TaskModel.findOne({
      user: userId,
      title,
      _id: { $ne: id },
    });

    if (existingTask) {
      res
        .status(400)
        .json({ message: "A task with this title already exists!" });
      return;
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.status = status || task.status;
    task.completed = completed || task.completed;

    await task.save();
    io.emit("taskUpdated", task);

    res.status(200).json(task);
    return;
  } catch (error: any) {
    console.log("Error in updateTask: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!req.user?.isVerified) {
      res.status(403).json({ message: "User is not verified!" });
      return;
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found!" });
      return;
    }

    if (!task.user.equals(userId)) {
      res.status(401).json({ message: "Not authorized!" });
    }

    await TaskModel.findByIdAndDelete(id);
    io.emit("taskDeleted", task);

    res.status(200).json(task);
    return;
  } catch (error: any) {
    console.log("Error in deleteTask: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getTaskStatus = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(400).json({ message: "User not found!" });
      return;
    }

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const completedTasks = await TaskModel.countDocuments({
      user: userId,
      completed: true,
      createdAt: { $gte: last30Days },
    });

    const pendingTasks = await TaskModel.countDocuments({
      user: userId,
      completed: false,
      createdAt: { $gte: last30Days },
    });

    const totalTasks = completedTasks + pendingTasks;

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const tasksCreatedLast30Days = await TaskModel.countDocuments({
      user: userId,
      createdAt: { $gte: last30Days },
    });

    const averageCompletionTime = await TaskModel.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          completed: true,
          createdAt: { $gte: last30Days },
        },
      },
      {
        $project: {
          completionTime: {
            $subtract: ["$updatedAt", "$createdAt"],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: "$completionTime" },
        },
      },
    ]);

    const avgCompletionTimeInHours = averageCompletionTime[0]?.avgCompletionTime
      ? averageCompletionTime[0].avgCompletionTime / (1000 * 60 * 60)
      : 0;

    console.log(
      "average completion time in hours",
      avgCompletionTimeInHours.toFixed(2)
    );

    res.status(200).json({
      completed: completedTasks,
      pending: pendingTasks,
      completionRate: completionRate.toFixed(2),
      tasksCreatedLast30Days,
      avgCompletionTime: avgCompletionTimeInHours.toFixed(2),
    });
  } catch (error: any) {
    console.log("Error in getTaskStatus: ", error.message);
    res.status(500).json({ message: error.message });
  }
};
