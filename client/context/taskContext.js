import axios from "axios";
import React, { createContext, useEffect } from "react";
import { useUserContext } from "./userContext";
import toast from "react-hot-toast";
import { useSocket } from "@/utils/socket";
import { useNotifications } from "./notificationContext";

const TasksContext = createContext();

const serverUrl = "http://localhost:8000/api/v1";

export const TasksProvider = ({ children }) => {
  const userId = useUserContext().user._id;
  const socket = useSocket();
  const { createNotification } = useNotifications();

  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [task, setTask] = React.useState({});

  const [isEditing, setIsEditing] = React.useState(false);
  const [priority, setPriority] = React.useState("all");
  const [activeTask, setActiveTask] = React.useState(null);
  const [modalMode, setModalMode] = React.useState("");
  const [profileModal, setProfileModal] = React.useState(false);

  const [taskStatus, setTaskStatus] = React.useState({
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    if (!socket) {
      console.error("Socket connection is null or not initialized!");
      return;
    }
    console.log("Socket connection established");
    socket.on("taskCreated", (newTask) => {
      setTasks((prevTasks) => [...prevTasks, newTask]);
    });

    socket.on("taskUpdated", (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    });

    socket.on("taskDeleted", (deletedTask) => {
      const taskId = deletedTask._id;
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const openModalForAdd = () => {
    setModalMode("add");
    setIsEditing(true);
    setTask({});
  };

  const openModalForEdit = (task) => {
    setModalMode("edit");
    setIsEditing(true);
    setActiveTask(task);
  };

  const openProfileModal = () => {
    setProfileModal(true);
  };

  const closeModal = () => {
    setIsEditing(false);
    setProfileModal(false);
    setModalMode("");
    setActiveTask(null);
    setTask({});
  };

  const getTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${serverUrl}/tasks`);

      setTasks(response.data.tasks);
    } catch (error) {
      console.log("Error getting tasks", error);
    }
    setLoading(false);
  };

  const getTask = async (taskId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${serverUrl}/task/${taskId}`);

      setTask(response.data);
    } catch (error) {
      console.log("Error getting task", error);
    }
    setLoading(false);
  };

  const createTask = async (task) => {
    setLoading(true);
    try {
      const res = await axios.post(`${serverUrl}/task/create`, task);

      console.log("Task created", res.data);

      setTasks([...tasks, res.data]);
      getTaskStatus();

      createNotification({
        message: `Task created: ${res.data.title}`,
        task: res.data,
        status: "unread",
      });

      toast.success("Task created successfully");
    } catch (error) {
      console.log("Error creating task", error);
      toast.error(error.response.data.message);
    }
    setLoading(false);
  };

  const updateTask = async (task) => {
    setLoading(true);
    try {
      const res = await axios.patch(`${serverUrl}/task/${task._id}`, task);

      const newTasks = tasks.map((tsk) => {
        return tsk._id === res.data._id ? res.data : tsk;
      });

      createNotification({
        message: `Task updated: ${res.data.title}`,
        task: res.data,
        status: "unread",
      });

      toast.success("Task updated successfully");

      setTasks(newTasks);
      getTaskStatus();
    } catch (error) {
      console.log("Error updating task", error);
      toast.error(error.response.data.message);
    }
  };

  const deleteTask = async (taskId) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${serverUrl}/task/${taskId}`);

      const newTasks = tasks.filter((tsk) => tsk._id !== taskId);

      setTasks(newTasks);
      getTaskStatus();

      createNotification({
        message: `Task deleted: ${res.data.title}`,
        status: "unread",
      });

      toast.success("Task Deleted successfully");
    } catch (error) {
      console.log("Error deleting task", error);
    }
  };

  const handleInput = (name) => (e) => {
    if (name === "setTask") {
      setTask(e);
    } else {
      setTask({ ...task, [name]: e.target.value });
    }
  };

  const completedTasks = tasks.filter((task) => task.completed);

  const activeTasks = tasks.filter((task) => !task.completed);

  const getTaskStatus = async () => {
    try {
      const response = await axios.get(`${serverUrl}/tasks/status`);
      setTaskStatus({
        completed: response.data.completed,
        pending: response.data.pending,
        tasksCreatedLast30Days: response.data.tasksCreatedLast30Days,
        completionRate: response.data.completionRate,
        averageCompletionTime: response.data.avgCompletionTime,
      });
    } catch (error) {
      console.log("Error getting task status", error);
    }
  };

  useEffect(() => {
    getTasks();
    getTaskStatus();
  }, [userId]);

  console.log("Active tasks", activeTasks);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        task,
        tasks,
        getTask,
        createTask,
        updateTask,
        deleteTask,
        priority,
        setPriority,
        handleInput,
        isEditing,
        setIsEditing,
        openModalForAdd,
        openModalForEdit,
        activeTask,
        closeModal,
        modalMode,
        openProfileModal,
        activeTasks,
        completedTasks,
        profileModal,
        taskStatus,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  return React.useContext(TasksContext);
};
