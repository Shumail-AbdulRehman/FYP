import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Response, Request, NextFunction, Errback } from "express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


// Routes import

import managerRouter from "./routes/manager.route.js";
import staffRouter from "./routes/staff.route.js"

// Routes 

app.use("/api/managers", managerRouter);
app.use("/api/staff", staffRouter)


//global catch

app.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    res.status(500).json({
        message: "Something went wrong",
    });
});


app.listen(process.env.PORT, () => {
    console.log(`Server is listening at port ${process.env.PORT}`);
});


export default app;