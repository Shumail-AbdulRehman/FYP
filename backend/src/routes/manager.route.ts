import { Router } from "express";
import { signupManager, loginManager } from "../controllers/manager.controller.js";

const router = Router();

router.post("/signup", signupManager);
router.post("/login", loginManager);

export default router;
