import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Response, Request, NextFunction } from "express";
import { ApiError } from "./utils/ApiError.js";
import "./cron/dailyTaskScheduler.js";
import "./cron/onceTaskScheduler.js";
import "./cron/taskStatusCron.js";
import "./cron/attendanceCron.js";
import "./cron/attendanceStatusCron.js";
import { runStartupCron } from "./cron/startupCron.js";




dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import managerRouter from "./routes/manager.route.js";
import staffRouter from "./routes/staff.route.js";
import locationRouter from "./routes/location.route.js";
import taskTemplateRouter from "./routes/taskTemplate.route.js";
import assignmentRouter from "./routes/assignment.route.js";
import attendanceRouter from "./routes/attendance.route.js";
import taskInstanceRouter from "./routes/taskInstance.route.js"
import commonRouter from "./routes/common.route.js"

app.use("/api/manager", managerRouter);
app.use("/api/staff", staffRouter);
app.use("/api/location", locationRouter);
app.use("/api/task-template", taskTemplateRouter);
app.use("/api/assignment", assignmentRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/task-instance",taskInstanceRouter)
app.use("/api/common",commonRouter)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
});

app.listen(process.env.PORT, async () => {
    console.log(`Server is listening at port ${process.env.PORT}`);
    await runStartupCron();
});

export default app;
