"use client";
import React from "react";
import { UserContextProvider } from "../context/userContext";
import { TasksProvider } from "../context/taskContext";
import { NotificationProvider } from "@/context/notificationContext";

interface Props {
  children: React.ReactNode;
}

function UserProvider({ children }: Props) {
  return (
    <UserContextProvider>
      <NotificationProvider>
        <TasksProvider>{children}</TasksProvider>
      </NotificationProvider>
    </UserContextProvider>
  );
}

export default UserProvider;
