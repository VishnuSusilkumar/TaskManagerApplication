import express from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import connect from "./db/connect";
import cookieParser from "cookie-parser";
import errorHandler from "./helpers/errorhandler";
import { createServer, Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import taskRouter from "./routes/taskRoutes";
import userRouter from "./routes/userRoute";
import notificationRouter from "./routes/notificationRoutes";

dotenv.config();

const port: number | string = process.env.PORT || 8000;

const app = express();

const corsOptions: CorsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(errorHandler);

app.use("/api/v1", taskRouter);
app.use("/api/v1", userRouter);
app.use("/api/v1", notificationRouter);

const server: HttpServer = createServer(app);
const io: SocketServer = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("error", (err: Error) => {
    console.error("WebSocket error:", err);
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connect();

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start server.....", (error as Error).message);
    process.exit(1);
  }
};

startServer();
export { io };
