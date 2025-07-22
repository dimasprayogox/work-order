// app.js (Server Express)
import cors from "cors";
import express from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";

import { setResponseHeader } from "./middleware/set-headers.js";

//auth
import authRoutes from "./routes/auth.routes.js";

// user details all role can use
import userDetailRoutes from './routes/user-details.routes.js';

//admin
import userRoutes from './routes/admin/user.routes.js';
import machineCategoryRoutes from './routes/admin/machine-category.routes.js';
import machineRoutes from './routes/admin/machine.routes.js';

//employee
import employeeDashboardRoutes from './routes/employee/dashboard.routes.js';
import issueRoutes from './routes/employee/issue.route.js';
import employeeMachineRoutes from './routes/employee/machine.routes.js';
import employeeWorkOrderRoutes from './routes/employee/workOrderRoute.js';

//technician
import technicianDashboardRoutes from './routes/technician/dashboard.routes.js';
import technicianWorkOrderRoutes from './routes/technician/workOrderRoute.js';

// logistics
import partRoutes from './routes/logistics/part.routes.js';
import partRequestRoutes from './routes/logistics/part-request.routes.js';

//manager
import managerDashboardRoutes from './routes/manager/dashboard.routes.js';
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
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        optionSuccessStatus: 200,
    })
);
app.use(logger("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", [setResponseHeader], (req, res) => {
    return res
        .status(200)
        .json(`Welcome to the server! ${new Date().toLocaleString()}`);
});


//auth
app.use("/api/auth", authRoutes);

//user details all role can use
app.use("/api/user-detail", userDetailRoutes);

//admin
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/machine-categories', machineCategoryRoutes);
app.use('/api/admin/machines', machineRoutes);

//employee
app.use('/api/employee/dashboard', employeeDashboardRoutes);
app.use('/api/employee/issues', issueRoutes);
app.use('/api/employee/machines', employeeMachineRoutes);
app.use('/api/employee/work-orders', employeeWorkOrderRoutes);

//technician
app.use('/api/technician/dashboard', technicianDashboardRoutes);
app.use('/api/technician/work-orders', technicianWorkOrderRoutes);

// logistics
app.use('/api/logistics/parts', partRoutes);
app.use('/api/logistics/part-requests', partRequestRoutes);

//manager
app.use('/api/manager/dashboard', managerDashboardRoutes);
app.use('/api/manager/work-orders', managerWorkOrderRoutes);
app.use('/api/manager/schedules', managerScheduleRoutes);

export default app;