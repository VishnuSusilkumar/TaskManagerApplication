import { useUserContext } from "@/context/userContext";
import socketIO from "socket.io-client";

const EndPoint = "https://taskmanager-3kcf.onrender.com";

export const useSocket = () => {
  const userId = useUserContext().user._id;

  const socket = socketIO(EndPoint, {
    query: { userId },
    transports: ["websocket"],
    path: "/socket.io",
  });

  return socket;
};
