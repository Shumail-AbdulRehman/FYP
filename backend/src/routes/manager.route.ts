import { Router } from "express";
import { signupManager } from "../controllers/manager.controller.js";

const router = Router();

router.post("/signup", signupManager);

export default router;
