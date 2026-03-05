    import express from "express";
    import cors from "cors";
    import cookieParser from "cookie-parser";
    import dotenv from "dotenv";

    dotenv.config();  
    const app = express();

    dotenv.config(); 
    app.use(cors());

    app.use(express.json({ limit: "16kb" }));
    app.use(express.urlencoded({ extended: true }));  
    app.use(express.static("public"));
    app.use(cookieParser());

    

    app.listen(process.env.PORT, () => {
    console.log(`Server is listening at port ${process.env.PORT}`);
    });

    export default app;