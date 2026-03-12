import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Response, Request, NextFunction, Errback } from "express";
import { ApiError } from "./utils/ApiError.js";
import "./cron/taskScheduler.js";
import "./cron/taskStatusCron.js";




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

app.use("/api/managers", managerRouter);
app.use("/api/staff", staffRouter);
app.use("/api/locations", locationRouter);
app.use("/api/task-templates", taskTemplateRouter);
app.use("/api/assignments", assignmentRouter);

app.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
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

app.listen(process.env.PORT, () => {
    console.log(`Server is listening at port ${process.env.PORT}`);
});

export default app;