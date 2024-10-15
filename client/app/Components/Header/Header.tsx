"use client";
import React, { useState, useEffect } from "react";
import { useUserContext } from "@/context/userContext";
import { bell } from "@/utils/Icons";
import { useRouter } from "next/navigation";
import { useTasks } from "@/context/taskContext";
import { useNotifications } from "@/context/notificationContext";
import NotificationModal from "../Modal/NotificationModal";
import Image from "next/image";

function Header() {
  const { user } = useUserContext();
  const { openModalForAdd, activeTasks } = useTasks();
  const { fetchNotifications, notifications, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const userId = user?._id;

  const [openModal, setOpenModal] = useState(false);
  const [response, setResponse] = useState([]);

  useEffect(() => {
    const getNotifications = async () => {
      const fetchedNotifications = await fetchNotifications();
      setResponse(fetchedNotifications); 
      console.log("Fetched notifcaiotn", fetchNotifications);
      
    };
    if (userId) {
      getNotifications();
    }
  }, [userId, fetchNotifications]);
  
  const unreadNotifications = response.filter((n: { status: string; }) => n.status === "unread");

  return (
    <header className="px-4 my-4 w-full flex items-center justify-between bg-[#f9f9f9]">
      {!userId && (
        <div className="flex items-center md:hidden mr-3">
          <Image src="/logo.png" width={28} height={28} alt="logo" />
        </div>
      )}
      <div className="flex flex-col md:flex-row items-start md:items-center">
        <h1 className="text-sm md:text-lg font-medium">
          {userId ? `Welcome, ${user.name}!` : "Welcome to Task Manager"}
        </h1>
        <p className="text-xs md:text-sm md:ml-4">
          {userId ? (
            <>
              You have{" "}
              <span className="font-bold text-[#3aafae]">
                {activeTasks.length}
              </span>
              &nbsp;active tasks
            </>
          ) : (
            "Please login to view your tasks"
          )}
        </p>
      </div>

      <div className={`flex items-center gap-2 md:gap-4 ${userId ? "mr-10" : "ml-auto"}`}>
        <button
          className="px-2 py-2 text-xs md:text-sm bg-[#3aafae] text-white rounded-[50px] hover:bg-[#00A1F1] hover:text-white transition-all duration-200 ease-in-out md:px-8 md:py-3"
          onClick={() => {
            if (userId) {
              openModalForAdd();
            } else {
              router.push("/login");
            }
          }}
        >
          {userId ? "Add a new Task" : "Login / Register"}
        </button>

        {userId && (
          <div className="relative">
            <div
              className="relative cursor-pointer text-gray-500 text-lg md:text-xl"
              onClick={() => setOpenModal(!openModal)}
            >
              {bell}
              {unreadNotifications.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#3ccba0] text-xs text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </div>

            <NotificationModal
              notifications={unreadNotifications}
              openModal={openModal}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              closeModal={() => setOpenModal(false)}
            />
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
