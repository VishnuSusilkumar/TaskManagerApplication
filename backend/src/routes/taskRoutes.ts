import express, { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  getTaskStatus
} from "../controllers/task/taskController";
import { protect } from "../middleware/authMiddleware";

const taskRouter: Router = express.Router();

taskRouter.post("/task/create", protect, createTask);
taskRouter.get("/tasks", protect, getTasks);
taskRouter.get("/task/:id", protect, getTask);
taskRouter.patch("/task/:id", protect, updateTask);
taskRouter.delete("/task/:id", protect, deleteTask);
taskRouter.get("/tasks/status", protect, getTaskStatus);

export default taskRouter;
