import cors from "cors";
import express from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";

import { setResponseHeader } from "./middleware/set-headers.js";

//auth
import authRoutes from "./routes/auth.routes.js";

//admin
import userRoutes from './routes/admin/user.routes.js';
import machineCategoryRoutes from './routes/admin/machine-category.routes.js';
import machineRoutes from './routes/admin/machine.routes.js';

//manager
import managerWorkOrderRoutes from './routes/manager/work-order.routes.js';
import managerScheduleRoutes from './routes/manager/schedule.routes.js';

const app = express();

const allowedOrigins = ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Timestamp",
      "X-Signature",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    optionSuccessStatus: 200,
  })
);
app.use(logger("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", [setResponseHeader], (req, res) => {
  // Show current time in ISO format and welcome message
  return res
    .status(200)
    .json(`Welcome to the server! ${new Date().toLocaleString()}`);
});


//auth
app.use("/api/auth", authRoutes);

//admin
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/machine-categories', machineCategoryRoutes);
app.use('/api/admin/machines', machineRoutes);

//manager
app.use('/api/manager/work-orders', managerWorkOrderRoutes);
app.use('/api/manager/schedules', managerScheduleRoutes);

export default app;
